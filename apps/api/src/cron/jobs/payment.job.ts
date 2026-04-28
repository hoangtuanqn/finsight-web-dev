import axios from 'axios';
import prisma from '../../lib/prisma';
import { getIO } from '../../utils/socket';

export async function checkSepayPayments() {
  const apiToken = process.env.SEPAY_API_TOKEN;
  const bankAccount = process.env.SEPAY_BANK_ACCOUNT;

  if (!apiToken || apiToken === 'your-sepay-api-token-here' || !bankAccount) {
    return;
  }

  try {
    const response = await axios.get('https://my.sepay.vn/userapi/transactions/list', {
      headers: { Authorization: `Bearer ${apiToken}` },
      params: { account_number: bankAccount, limit: 50 },
    });

    const transactions = response.data?.transactions || [];

    const pendingInvoices = await (prisma as any).transaction.findMany({
      where: { status: 'PENDING' },
    });

    if (pendingInvoices.length === 0 && transactions.length === 0) return;

    for (const tx of transactions) {
      const content = (tx.transaction_content || '').toUpperCase();
      const sepayRefId = String(tx.id);

      const alreadyProcessed = await (prisma as any).transaction.findFirst({
        where: { sepayRef: sepayRefId },
      });
      if (alreadyProcessed) continue;

      const amountIn = parseFloat(tx.amount_in || '0');
      const invoice = pendingInvoices.find((inv: any) => 
        content.includes(inv.transferCode.toUpperCase()) &&
        amountIn >= inv.amount
      );

      if (!invoice) continue;

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); 

      const quotaBonus = invoice.plan === 'PROMAX' ? 50 : 20;

      await (prisma as any).$transaction([
        (prisma as any).transaction.update({
          where: { id: invoice.id },
          data: { status: 'PAID', sepayRef: sepayRefId, paidAt: now },
        }),
        (prisma as any).user.update({
          where: { id: invoice.userId },
          data: {
            level: invoice.plan,
            levelExpiresAt: expiresAt,
            strategyQuota: { increment: quotaBonus },
          },
        }),
        (prisma as any).notification.create({
          data: {
            userId: invoice.userId,
            type: 'UPGRADE_SUCCESS',
            title: `🎉 Nâng cấp ${invoice.plan} thành công!`,
            message: `Tài khoản đã được nâng cấp lên gói ${invoice.plan}. Bạn nhận thêm ${quotaBonus} lượt tạo chiến lược đầu tư. Hiệu lực đến ${expiresAt.toLocaleDateString('vi-VN')}.`,
            severity: 'INFO',
          },
        }),
      ]);

      console.log(`[SePay] ✅ Activated ${invoice.plan} for User ${invoice.userId} (Ref: ${sepayRefId})`);
      
      try {
        const io = getIO();
        if (io) {
          io.to(`user_${invoice.userId}`).emit('subscription:upgraded', { 
            level: invoice.plan, 
            message: `Tài khoản đã được nâng cấp lên gói ${invoice.plan}.`
          });
        }
      } catch (e: any) {
        console.error('[SePay] Socket emit failed:', e.message);
      }
    }
  } catch (err: any) {
    if (err.response?.status === 429) {
      console.warn('[SePay] Rate limited. Will retry next cycle.');
    } else {
      console.error('[SePay] API error:', err.message);
    }
  }
}

export async function expirePendingInvoices() {
  const now = new Date();
  const result = await (prisma as any).transaction.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: now },
    },
    data: { status: 'EXPIRED' },
  });

  if (result.count > 0) {
    console.log(`[Invoice] Expired ${result.count} pending invoice(s)`);
  }
}
