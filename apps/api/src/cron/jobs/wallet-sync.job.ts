import prisma from '../../lib/prisma';
import { fetchSepayTransactions, toSepayDate } from '../../services/sepay.service';
import { getIO } from '../../utils/socket';

// ─── Quét tất cả ví ngân hàng có token ───────────────────────────────────────

export async function syncAllBankWallets() {
  const wallets = await (prisma as any).wallet.findMany({
    where: {
      type: 'BANK',
      sepayToken: { not: null },
      sepayLinkedAt: { not: null },
    },
  });

  if (wallets.length === 0) return;

  // Chạy song song cho tất cả các ví
  await Promise.allSettled(wallets.map((w: any) => syncWalletTransactions(w)));
}

// ─── Đồng bộ một ví cụ thể ───────────────────────────────────────────────────

export async function syncWalletTransactions(wallet: any) {
  const token: string = wallet.sepayToken;

  // 1. Chỉ lấy giao dịch từ thời điểm liên kết (sepayLinkedAt)
  const linkedDate = new Date(wallet.sepayLinkedAt);
  const transactionDateMin = toSepayDate(linkedDate);

  // 2. Sử dụng since_id để tối ưu (nếu đã có GD trước đó)
  const sinceId: string | undefined = wallet.lastSyncedTxId ?? undefined;

  let transactions: any[] = [];
  let latestBalance: number | null = null;

  try {
    const result = await fetchSepayTransactions({
      token,
      accountNumber: wallet.bankAccountNumber ?? undefined,
      transactionDateMin, // Lọc theo ngày bắt đầu liên kết
      sinceId, // Lọc theo ID giao dịch cuối cùng đã lấy
      limit: 100,
    });
    transactions = result.transactions;
    latestBalance = result.latestBalance;
  } catch (err: any) {
    console.error(`[WalletSync] API error for wallet ${wallet.id}:`, err.message);
    return;
  }

  // 3. TỰ ĐỘNG ĐỒNG BỘ SỐ DƯ (Luôn thực hiện)
  if (latestBalance !== null && latestBalance !== wallet.balance) {
    await (prisma as any).wallet.update({
      where: { id: wallet.id },
      data: { balance: latestBalance },
    });

    emitToUser(wallet.userId, 'wallet:balance_updated', {
      walletId: wallet.id,
      walletName: wallet.name,
      balance: latestBalance,
    });
  }

  if (transactions.length === 0) return;

  // 4. LƯU VÀO KHU VỰC CHỜ (BankTransactionPending)
  let newPendingCount = 0;
  let maxTxId = sinceId ?? '0';

  for (const tx of transactions) {
    // Chỉ lấy giao dịch CÓ THỜI GIAN >= thời điểm liên kết (Double check)
    const txDate = new Date(tx.transaction_date);
    if (txDate < linkedDate) continue;

    const sepayTxId = String(tx.id);
    if (BigInt(sepayTxId) > BigInt(maxTxId)) maxTxId = sepayTxId;

    // Kiểm tra xem giao dịch này đã tồn tại trong hàng chờ hoặc đã được xử lý chưa
    const existing = await (prisma as any).bankTransactionPending.findUnique({
      where: {
        walletId_sepayTxId: {
          walletId: wallet.id,
          sepayTxId: sepayTxId,
        },
      },
    });

    if (existing) continue;

    const amountIn = parseFloat(tx.amount_in || '0');
    const amountOut = parseFloat(tx.amount_out || '0');
    if (amountIn <= 0 && amountOut <= 0) continue;

    const isIncome = amountIn > 0;
    const amount = isIncome ? amountIn : amountOut;

    // Tạo bản ghi chờ duyệt
    await (prisma as any).bankTransactionPending.create({
      data: {
        userId: wallet.userId,
        walletId: wallet.id,
        sepayTxId: sepayTxId,
        amount,
        type: isIncome ? 'INCOME' : 'EXPENSE',
        transactionDate: txDate,
        description: tx.transaction_content || 'Giao dịch ngân hàng',
        bankBrandName: tx.bank_brand_name,
        accountNumber: tx.account_number,
        status: 'PENDING',
      },
    });

    newPendingCount++;
  }

  // 5. Cập nhật lastSyncedTxId để lần sau không quét lại GD cũ
  if (maxTxId !== (wallet.lastSyncedTxId ?? '0')) {
    await (prisma as any).wallet.update({
      where: { id: wallet.id },
      data: { lastSyncedTxId: maxTxId },
    });
  }

  // 6. Phát Realtime thông báo có giao dịch mới chờ duyệt
  if (newPendingCount > 0) {
    console.log(`[WalletSync] 📥 "${wallet.name}": +${newPendingCount} giao dịch mới đang chờ duyệt`);
    emitToUser(wallet.userId, 'wallet:new_pending_transactions', {
      walletId: wallet.id,
      walletName: wallet.name,
      count: newPendingCount,
    });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emitToUser(userId: string, event: string, payload: any) {
  try {
    const io = getIO();
    if (io) io.to(`user_${userId}`).emit(event, payload);
  } catch {
    /* Socket chưa khởi tạo */
  }
}
