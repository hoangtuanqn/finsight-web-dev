import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
   Clock, CheckCircle2, XCircle, Copy, 
  ArrowLeft, Loader2, Ban, Zap, Crown, PartyPopper
} from 'lucide-react';
import { subscriptionAPI } from '../api/index';
import { toast } from 'sonner';
import { useSocket } from '../context/SocketContext';
import { motion } from 'framer-motion';
  
const STATUS_MAP = {
  PENDING:   { label: 'Chờ thanh toán', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Clock },
  PAID:      { label: 'Đã thanh toán', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
  EXPIRED:   { label: 'Hết hạn', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
  CANCELLED: { label: 'Đã hủy', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Ban },
};

const PLAN_INFO = {
  PRO:    { name: 'Pro', icon: Zap, color: '#3b82f6' },
  PROMAX: { name: 'Pro Max', icon: Crown, color: '#f59e0b' },
};

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { socket } = useSocket() as any;

  const fetchInvoice = useCallback(async () => {
    try {
      const res = await subscriptionAPI.getInvoice(id!);
      setTx(res.data?.data?.transaction);
    } catch {
      toast.error('Không tìm thấy hóa đơn');
      navigate('/upgrade');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // Poll for payment status every 10s when PENDING
  useEffect(() => {
    if (!tx || tx.status !== 'PENDING') return;
    const interval = setInterval(async () => {
      try {
        const res = await subscriptionAPI.getInvoice(id!);
        const updated = res.data?.data?.transaction;
        if (updated && updated.status !== 'PENDING') {
          setTx(updated);
          if (updated.status === 'PAID') {
            setShowSuccessModal(true);
          }
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [tx, id]);

  // Socket listener for real-time update
  useEffect(() => {
    if (!socket || !tx || tx.status !== 'PENDING') return;

    const handleSubUpgraded = (data: any) => {
      console.log('Socket event: subscription:upgraded', data);
      setShowSuccessModal(true);
    };

    socket.on('subscription:upgraded', handleSubUpgraded);
    return () => socket.off('subscription:upgraded', handleSubUpgraded);
  }, [socket, tx]);

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy hóa đơn này?')) return;
    setCancelling(true);
    try {
      const res = await subscriptionAPI.cancelInvoice(id!);
      setTx(res.data?.data?.transaction);
      toast.info('Hóa đơn đã bị hủy.');
    } catch {
      toast.error('Không thể hủy hóa đơn');
    } finally {
      setCancelling(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await subscriptionAPI.verifyPayment();
      toast.info(res.data?.data?.message || 'Đang kiểm tra...');
      // After manual verify, we refresh the invoice once
      const invRes = await subscriptionAPI.getInvoice(id!);
      setTx(invRes.data?.data?.transaction);
    } catch {
      toast.error('Có lỗi xảy ra khi kiểm tra');
    } finally {
      setVerifying(false);
    }
  };

  const copyTransferCode = () => {
    if (tx?.transferCode) {
      navigator.clipboard.writeText(tx.transferCode);
      toast.success('Đã copy mã chuyển khoản!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!tx) return null;

  const status = STATUS_MAP[tx.status] || STATUS_MAP.PENDING;
  const plan = PLAN_INFO[tx.plan] || PLAN_INFO.PRO;
  const StatusIcon = status.icon;
  const PlanIcon = plan.icon;
  const timeLeft = tx.status === 'PENDING' ? Math.max(0, new Date(tx.expiresAt) - Date.now()) : 0;
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] right-[15%] w-[300px] h-[300px] rounded-full bg-blue-600/5 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/upgrade')}
          className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Quay lại bảng giá
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/30 to-cyan-500/10 flex items-center justify-center">
                <PlanIcon size={24} style={{ color: plan.color }} />
              </div>
              <div>
                <h1 className="text-xl font-black">Hóa đơn — Gói {plan.name}</h1>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Mã: {tx.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bg} border ${status.border}`}>
              <StatusIcon size={14} className={status.color} />
              <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
            </div>
          </div>

          {/* QR Code */}
          {tx.status === 'PENDING' && (
            <div className="flex flex-col items-center mb-8">
              <div className="bg-white rounded-2xl p-4 mb-6 shadow-lg">
                <img 
                  src={tx.qrUrl} 
                  alt="QR Thanh toán"
                  className="w-64 h-64 object-contain"
                />
              </div>

              <p className="text-sm text-[var(--color-text-secondary)] text-center mb-2">
                Quét mã QR bằng ứng dụng ngân hàng để thanh toán
              </p>

              {timeLeft > 0 && (
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mt-2">
                  <Clock size={14} />
                  <span>Hết hạn sau: {hoursLeft}h {minutesLeft}p</span>
                </div>
              )}
            </div>
          )}

          {/* Payment Success */}
          {tx.status === 'PAID' && (
            <div className="flex flex-col items-center mb-8 py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4"
              >
                <CheckCircle2 size={40} className="text-emerald-400" />
              </motion.div>
              <h2 className="text-xl font-black text-emerald-400 mb-2">Thanh toán thành công!</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Gói {plan.name} đã được kích hoạt. Thanh toán lúc {new Date(tx.paidAt).toLocaleString('vi-VN')}.
              </p>
            </div>
          )}

          {/* Details */}
          <div className="space-y-4 border-t border-[var(--color-border)] pt-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-text-muted)]">Gói nâng cấp</span>
              <span className="text-sm font-bold">{plan.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-text-muted)]">Số tiền</span>
              <span className="text-sm font-bold text-blue-400">{tx.amount.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-text-muted)]">Nội dung CK</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-[var(--color-bg-elevated)] px-2 py-1 rounded font-mono">
                  {tx.transferCode}
                </code>
                <button onClick={copyTransferCode} className="text-blue-400 hover:text-blue-300 transition-colors" title="Copy">
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-text-muted)]">Ngày tạo</span>
              <span className="text-sm font-medium">{new Date(tx.createdAt).toLocaleString('vi-VN')}</span>
            </div>
            {tx.paidAt && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-muted)]">Ngày thanh toán</span>
                <span className="text-sm font-medium text-emerald-400">{new Date(tx.paidAt).toLocaleString('vi-VN')}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {tx.status === 'PENDING' && (
            <div className="mt-8 flex flex-col gap-3">
              <button 
                onClick={handleVerify}
                disabled={verifying}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {verifying ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Tôi đã chuyển tiền
              </button>
              
              <button 
                onClick={handleCancel}
                disabled={cancelling}
                className="btn-secondary w-full"
              >
                {cancelling ? <Loader2 size={16} className="animate-spin" /> : 'Hủy hóa đơn'}
              </button>
            </div>
          )}

          {(tx.status === 'EXPIRED' || tx.status === 'CANCELLED') && (
            <div className="mt-8">
              <button 
                onClick={() => navigate('/upgrade')}
                className="btn-primary w-full"
              >
                Tạo hóa đơn mới
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 glass-card max-w-sm w-full text-center py-10 px-8 border-emerald-500/30"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <PartyPopper size={40} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black mb-3">Thanh toán thành công!</h2>
            <p className="text-[var(--color-text-secondary)] text-sm mb-8 leading-relaxed">
              Tài khoản của bạn đã được nâng cấp. Chúc bạn có những trải nghiệm tuyệt vời cùng các tính năng Premium.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full py-4 font-bold"
            >
              Tiếp tục
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
