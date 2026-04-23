import axios from 'axios';
import prisma from '../../lib/prisma.js';
import { getIO } from '../../utils/socket.js';

export async function checkSepayPayments() {
  const apiToken = process.env.SEPAY_API_TOKEN;
  const bankAccount = process.env.SEPAY_BANK_ACCOUNT;

  if (!apiToken || apiToken === 'your-sepay-api-token-here' || !bankAccount) {
    return; // SePay not configured, skip silently
  }

  try {
    const response = await axios.get('https://my.sepay.vn/userapi/transactions/list', {
      headers: { Authorization: `Bearer ${apiToken}` },
      params: { account_number: bankAccount, limit: 50 },
    });

    const transactions = response.data?.transactions || [];

    for (const tx of transactions) {
      const content = (tx.transaction_content || '').toUpperCase().trim();
      
      // Match pattern: UPGRADE PRO <userId> [suffix]
      const match = content.match(/UPGRADE\s+(PRO|PROMAX)\s+(\S+)(?:\s+(\S+))?/);
      if (!match) continue;

      const plan = match[1];
      const userId = match[2];
      const suffix = match[3];
      const transferCode = suffix ? `UPGRADE ${plan} ${userId} ${suffix}` : `UPGRADE ${plan} ${userId}`;
      const sepayRefId = String(tx.id);

      // Skip if already processed
      const alreadyProcessed = await prisma.transaction.findFirst({
        where: { sepayRef: sepayRefId },
      });
      if (alreadyProcessed) continue;

      // Find matching PENDING invoice by transferCode
      const invoice = await prisma.transaction.findFirst({
        where: {
          transferCode: { contains: transferCode, mode: 'insensitive' },
          status: 'PENDING',
          amount: { lte: parseFloat(tx.amount_in || 0) },
        },
      });

      if (!invoice) continue;

      // Activate subscription
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: invoice.id },
          data: { status: 'PAID', sepayRef: sepayRefId, paidAt: now },
        }),
        prisma.user.update({
          where: { id: invoice.userId },
          data: { level: plan, levelExpiresAt: expiresAt },
        }),
        prisma.notification.create({
          data: {
            userId: invoice.userId,
            type: 'UPGRADE_SUCCESS',
            title: `🎉 Nâng cấp ${plan} thành công!`,
            message: `Tài khoản đã được nâng cấp lên gói ${plan}. Hiệu lực đến ${expiresAt.toLocaleDateString('vi-VN')}.`,
            severity: 'INFO',
          },
        }),
      ]);

      console.log(`[SePay] ✅ Activated ${plan} for User ${invoice.userId} (SePay ref: ${sepayRefId})`);
      
      // Emit socket event to the user
      try {
        const io = getIO();
        io.to(`user_${invoice.userId}`).emit('subscription:upgraded', { 
          level: plan, 
          message: `Tài khoản đã được nâng cấp lên gói ${plan}.`
        });
      } catch (e) {
        console.error('[SePay] Failed to emit socket event:', e.message);
      }
    }
  } catch (err) {
    if (err.response?.status === 429) {
      console.warn('[SePay] Rate limited. Will retry next cycle.');
    } else {
      console.error('[SePay] API error:', err.message);
    }
  }
}

export async function expirePendingInvoices() {
  const now = new Date();
  const result = await prisma.transaction.updateMany({
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
