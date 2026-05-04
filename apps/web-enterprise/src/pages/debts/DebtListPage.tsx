import { Button, Input } from '@repo/ui';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowDownRight, ArrowUpRight, Clock, Plus, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { enterpriseAuthAPI } from '../../api';

export default function DebtListPage() {
  const navigate = useNavigate();
  const [debts, setDebts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchDebts();
  }, [filterType]);

  const fetchDebts = async () => {
    try {
      const res = await (enterpriseAuthAPI as any).getDebts({
        type: filterType === 'ALL' ? undefined : filterType,
      });
      if (res.data.success) {
        setDebts(res.data.data);
      } else {
        toast.error(res.data.error || 'Không thể tải danh sách khoản nợ');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Lỗi kết nối server';
      toast.error(`Lỗi: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'PAID':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'OVERDUE':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'DRAFT':
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      case 'DISPUTED':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'WRITTEN_OFF':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Đang thực hiện';
      case 'PAID':
        return 'Đã tất toán';
      case 'OVERDUE':
        return 'Quá hạn';
      case 'DRAFT':
        return 'Bản nháp';
      case 'DISPUTED':
        return 'Tranh chấp';
      case 'WRITTEN_OFF':
        return 'Đã xóa nợ';
      default:
        return status;
    }
  };

  const filteredDebts = search.trim()
    ? debts.filter(
        (d) =>
          (d.internalCode || '').toLowerCase().includes(search.toLowerCase()) ||
          (d.party?.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (d.notes || '').toLowerCase().includes(search.toLowerCase()),
      )
    : debts;

  const stats = {
    receivable: debts.filter((d) => d.type === 'RECEIVABLE').reduce((sum, d) => sum + d.outstanding, 0),
    payable: debts.filter((d) => d.type === 'PAYABLE').reduce((sum, d) => sum + d.outstanding, 0),
    overdueCount: debts.filter((d) => d.status === 'OVERDUE').length,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
            <Clock size={12} /> Quản lý công nợ
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Sổ Cái Công Nợ</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            Theo dõi dòng tiền, lịch thanh toán và tình hình công nợ toàn doanh nghiệp.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            appName="web-enterprise"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer"
            onClick={() => navigate('/debts/new')}
          >
            <Plus size={18} /> Ghi nhận Nợ mới
          </Button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={80} />
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tổng Phải Thu</p>
          <h3 className="text-2xl font-black text-white mb-1">{formatCurrency(stats.receivable)}</h3>
          <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold">
            <ArrowUpRight size={14} /> Dòng tiền vào
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingDown size={80} />
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tổng Phải Trả</p>
          <h3 className="text-2xl font-black text-white mb-1">{formatCurrency(stats.payable)}</h3>
          <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-bold">
            <ArrowDownRight size={14} /> Dòng tiền ra
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertCircle size={80} />
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Khoản Quá Hạn</p>
          <h3 className="text-2xl font-black text-white mb-1">{stats.overdueCount} hồ sơ</h3>
          <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-bold">
            <Clock size={14} /> Cần xử lý ngay
          </div>
        </div>
      </div>

      {/* ── Filter & Search ── */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
            <Search size={18} />
          </div>
          <Input
            placeholder="Tìm kiếm theo mã, đối tác hoặc nội dung..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border-slate-800 rounded-2xl text-sm focus:border-emerald-500/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex p-1 bg-slate-900/50 border border-slate-800 rounded-2xl">
          {['ALL', 'RECEIVABLE', 'PAYABLE'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${filterType === t ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t === 'ALL' ? 'Tất cả' : t === 'RECEIVABLE' ? 'Phải thu' : 'Phải trả'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Khoản nợ
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Đối tác
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Số tiền gốc
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Ngày đến hạn
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Trạng thái
                </th>
                <th className="px-6 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500 text-sm font-medium">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500 text-sm font-medium">
                    Không tìm thấy khoản nợ nào.
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => (
                  <tr
                    key={debt.id}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/debts/${debt.id}`)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${debt.type === 'RECEIVABLE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}
                        >
                          {debt.type === 'RECEIVABLE' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {debt.internalCode || 'N/A'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">
                            {debt.origin}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-slate-300">{debt.party?.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{debt.party?.internalCode}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-white font-mono">{formatCurrency(debt.principal)}</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{debt.interestMethod}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-slate-300">
                        {new Date(debt.dueDate).toLocaleDateString('vi-VN')}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusStyle(debt.status)}`}
                      >
                        {getStatusLabel(debt.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-slate-500 hover:text-white transition-colors">
                        <Plus size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
