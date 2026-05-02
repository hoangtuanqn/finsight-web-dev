import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Modal } from '@repo/ui/modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Building2,
  Filter,
  History,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { enterpriseAuthAPI } from '../api';

interface Contact {
  id?: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

interface BankAccount {
  id?: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
}

interface Party {
  id: string;
  taxCode: string;
  name: string;
  shortName: string;
  internalCode: string;
  typeTags: string[];
  creditLimit: number;
  status: string;
  isRelatedParty: boolean;
  contacts: Contact[];
  bankAccounts: BankAccount[];
  personInCharge?: { id: string; fullName: string };
  createdAt: string;
}

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchAuditLogs = async (id: string) => {
    try {
      setLoadingAudit(true);
      const res = await enterpriseAuthAPI.getAuditLogs(id);
      if (res.data.success) {
        setAuditLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Search & Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState<Partial<Party>>({
    name: '',
    shortName: '',
    taxCode: '',
    typeTags: ['CUSTOMER'],
    creditLimit: 0,
    isRelatedParty: false,
    contacts: [{ name: '', position: '', email: '', phone: '', isPrimary: true }],
    bankAccounts: [],
  });

  useEffect(() => {
    fetchParties();
  }, [typeFilter, statusFilter]);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const res = await (enterpriseAuthAPI as any).getParties({
        search,
        type: typeFilter,
        status: statusFilter,
      });
      if (res.data.success) {
        setParties(res.data.data);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách đối tác');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchParties();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await (enterpriseAuthAPI as any).createParty(formData);
      if (res.data.success) {
        toast.success('Đã tạo đối tác thành công');
        setIsModalOpen(false);
        fetchParties();
        setFormData({
          name: '',
          shortName: '',
          taxCode: '',
          typeTags: ['CUSTOMER'],
          creditLimit: 0,
          isRelatedParty: false,
          contacts: [{ name: '', position: '', email: '', phone: '', isPrimary: true }],
          bankAccounts: [],
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi tạo đối tác');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'INACTIVE':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'BLACKLIST':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const stats = useMemo(() => {
    const total = parties.length;
    const active = parties.filter((p) => p.status === 'ACTIVE').length;
    const totalCreditLimit = parties.reduce((acc, p) => acc + (p.creditLimit || 0), 0);
    const roleCounts = parties.reduce((acc: any, p) => {
      p.typeTags.forEach((t) => {
        acc[t] = (acc[t] || 0) + 1;
      });
      return acc;
    }, {});

    return { total, active, totalCreditLimit, roleCounts };
  }, [parties]);

  const SUMMARY_CARDS = [
    {
      label: 'Tổng Đối Tác',
      value: stats.total,
      color: '#3b82f6',
      gradient: 'from-blue-500 to-cyan-400',
      icon: Users,
    },
    {
      label: 'Đang Hoạt Động',
      value: stats.active,
      color: '#10b981',
      gradient: 'from-emerald-500 to-teal-400',
      icon: ShieldCheck,
    },
    {
      label: 'Tổng Hạn Mức',
      value: formatCurrency(stats.totalCreditLimit),
      color: '#f59e0b',
      gradient: 'from-amber-500 to-orange-400',
      icon: Building2,
    },
    {
      label: 'Tỉ lệ Hợp tác',
      value: stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : '0%',
      color: '#8b5cf6',
      gradient: 'from-purple-500 to-violet-400',
      icon: History,
    },
  ];

  const chartData = Object.entries(stats.roleCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">
            <Building2 size={12} /> Quản lý danh mục
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Đối Tác Doanh Nghiệp</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            Phân tích và quản lý mạng lưới khách hàng, nhà cung cấp và quan hệ tài chính.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            appName="web-enterprise"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} /> Thêm Đối Tác
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {SUMMARY_CARDS.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="relative rounded-3xl p-6 border border-slate-800 bg-slate-900/50 overflow-hidden group hover:border-emerald-500/30 transition-all shadow-lg"
            style={{
              background: 'var(--color-bg-card)',
              borderColor: `${item.color}25`,
            }}
          >
            <div
              className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
              style={{ background: item.color }}
            />
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-white transition-colors"
                style={{ color: item.color }}
              >
                <item.icon size={18} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
            </div>
            <p className={`text-2xl font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
              {item.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Distribution Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-900/50 rounded-3xl p-6 border border-slate-800 shadow-xl">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Filter size={14} className="text-emerald-500" />
            Cơ cấu vai trò đối tác
          </h3>
          <div className="h-[240px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#f8fafc',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900/50 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white tracking-tight">Xếp hạng tín nhiệm & Tuân thủ</h4>
              <p className="text-sm text-slate-400">
                Hệ thống đang theo dõi {stats.active} đối tác đang hoạt động an toàn.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Đối tác nội bộ</p>
              <p className="text-xl font-bold text-white">{parties.filter((p) => p.isRelatedParty).length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Nợ đến hạn ước tính</p>
              <p className="text-xl font-bold text-emerald-400">0 VND</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <form onSubmit={handleSearch} className="flex-1 min-w-[300px] relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors"
            size={18}
          />
          <Input
            placeholder="Tìm kiếm theo tên, MST hoặc mã nội bộ..."
            className="w-full pl-12 pr-4 py-3 bg-slate-950 border-slate-800 rounded-xl focus:border-emerald-500/50 transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl">
            <Filter size={16} className="text-slate-500" />
            <select
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-300"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Tất cả vai trò</option>
              <option value="CUSTOMER">Khách hàng</option>
              <option value="SUPPLIER">Nhà cung cấp</option>
              <option value="BANK">Ngân hàng</option>
              <option value="STATE">Cơ quan nhà nước</option>
              <option value="INTERNAL">Nội bộ</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl">
            <ShieldAlert size={16} className="text-slate-500" />
            <select
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-300"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
              <option value="BLACKLIST">Danh sách đen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {/* ── Main Content Area ── */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl">
            <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}

        {parties.length === 0 && !loading ? (
          <div className="py-32 text-center bg-slate-900/50 border border-slate-800 rounded-3xl shadow-xl">
            <div className="flex flex-col items-center max-w-sm mx-auto">
              <div className="w-20 h-20 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mb-6">
                <Building2 size={32} className="text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Chưa có đối tác</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">
                Bắt đầu xây dựng mạng lưới kinh doanh bằng cách thêm đối tác đầu tiên của bạn.
              </p>
              <Button
                appName="web-enterprise"
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={18} /> Thêm ngay
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <Table>
              <TableHeader className="bg-slate-800/80">
                <TableRow className="border-b border-slate-800">
                  <TableHead className="py-5 font-bold text-slate-300">Đối Tác</TableHead>
                  <TableHead className="font-bold text-slate-300">Định Danh</TableHead>
                  <TableHead className="font-bold text-slate-300">Vai Trò</TableHead>
                  <TableHead className="text-right font-bold text-slate-300">Hạn Mức</TableHead>
                  <TableHead className="font-bold text-slate-300">Trạng Thái</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parties.map((party) => (
                  <TableRow
                    key={party.id}
                    className="hover:bg-slate-800/30 transition-colors border-b border-slate-800/50 group"
                    onClick={() => {
                      setSelectedParty(party);
                      setIsDetailOpen(true);
                      fetchAuditLogs(party.id);
                    }}
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/50 transition-all shadow-inner">
                          <Building2 size={24} />
                        </div>
                        <div>
                          <p className="text-[15px] font-black text-white">{party.name}</p>
                          {party.shortName && (
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{party.shortName}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          {party.internalCode}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">{party.taxCode || 'Chưa cập nhật MST'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {party.typeTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-slate-800 text-[10px] font-black rounded-lg text-slate-400 border border-slate-700 uppercase tracking-tight"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-mono text-[14px] font-bold text-white">{formatCurrency(party.creditLimit)}</p>
                      {party.isRelatedParty && (
                        <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                          Nội Bộ
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 text-[11px] font-black rounded-full border ${getStatusStyle(party.status)}`}
                      >
                        {party.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button className="p-2 text-slate-500 hover:text-white transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Đăng ký Đối Tác Mới"
        className="max-w-[750px] w-full bg-slate-900 border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto px-4 pb-4 custom-scrollbar">
          {/* Section 1: Basic Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Thông tin cơ bản</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-slate-400 ml-1">Tên Pháp Nhân *</label>
                <Input
                  required
                  placeholder="Ví dụ: Công ty TNHH Giải pháp FinSight"
                  className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-slate-400 ml-1">Tên Viết Tắt</label>
                <Input
                  placeholder="Ví dụ: FINSIGHT"
                  className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-slate-400 ml-1">Mã Số Thuế / Định Danh</label>
                <Input
                  placeholder="Nhập MST hoặc số CCCD"
                  className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                  value={formData.taxCode}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-slate-400 ml-1">Hạn Mức Tín Dụng (VND)</label>
                <Input
                  type="number"
                  placeholder="0"
                  className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-mono"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Roles */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Vai trò & Phân loại
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { id: 'CUSTOMER', label: 'Khách hàng' },
                { id: 'SUPPLIER', label: 'Nhà cung cấp' },
                { id: 'BANK', label: 'Ngân hàng' },
                { id: 'STATE', label: 'Cơ quan thuế/nhà nước' },
                { id: 'INTERNAL', label: 'Nội bộ' },
              ].map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => {
                    const tags = formData.typeTags || [];
                    if (tags.includes(role.id)) {
                      setFormData({ ...formData, typeTags: tags.filter((t) => t !== role.id) });
                    } else {
                      setFormData({ ...formData, typeTags: [...tags, role.id] });
                    }
                  }}
                  className={`px-5 py-3 rounded-2xl text-[12px] font-bold transition-all border ${
                    formData.typeTags?.includes(role.id)
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                      : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl group cursor-pointer hover:bg-amber-500/8 transition-colors">
              <input
                type="checkbox"
                id="isRelatedModal"
                checked={formData.isRelatedParty}
                onChange={(e) => setFormData({ ...formData, isRelatedParty: e.target.checked })}
                className="w-5 h-5 rounded-lg border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="isRelatedModal" className="text-[13px] font-bold text-amber-500/80 cursor-pointer">
                Đánh dấu là đối tác nội bộ (Related Party)
                <span className="block text-[11px] font-medium text-amber-500/40 mt-0.5">
                  Dữ liệu sẽ được tách báo cáo riêng theo chuẩn kế toán.
                </span>
              </label>
            </div>
          </div>

          {/* Section 3: Contacts */}
          <div className="space-y-6 pt-2 pb-4">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
              <div className="flex items-center gap-2">
                <Users size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Danh sách đầu mối liên hệ
                </span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            </div>

            <div className="space-y-4">
              {formData.contacts?.map((contact, idx) => (
                <div key={idx} className="relative group/contact overflow-hidden">
                  {/* Subtle background glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover/contact:opacity-100 transition-opacity" />

                  <div className="relative p-6 bg-slate-950/40 border border-slate-800 rounded-[2rem] space-y-6 backdrop-blur-sm">
                    {/* Header with Index and Delete */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-black text-emerald-500">
                          {idx + 1}
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                          Thông tin liên hệ {idx === 0 ? '(Chính)' : ''}
                        </span>
                      </div>

                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newContacts = [...(formData.contacts || [])];
                            newContacts.splice(idx, 1);
                            setFormData({ ...formData, contacts: newContacts });
                          }}
                          className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <AlertTriangle size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name Field */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Họ và tên nhân sự
                        </label>
                        <div className="relative group/input">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-emerald-500 transition-colors">
                            <User size={18} />
                          </div>
                          <Input
                            placeholder="Ví dụ: Nguyễn Văn A"
                            className="w-full bg-slate-950/50 border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none text-sm font-medium"
                            value={contact.name}
                            onChange={(e) => {
                              const newContacts = [...(formData.contacts || [])];
                              newContacts[idx].name = e.target.value;
                              setFormData({ ...formData, contacts: newContacts });
                            }}
                          />
                        </div>
                      </div>

                      {/* Position Field */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Chức danh / Bộ phận
                        </label>
                        <div className="relative group/input">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-emerald-500 transition-colors">
                            <Building2 size={18} />
                          </div>
                          <Input
                            placeholder="Ví dụ: Kế toán trưởng"
                            className="w-full bg-slate-950/50 border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none text-sm font-medium"
                            value={contact.position}
                            onChange={(e) => {
                              const newContacts = [...(formData.contacts || [])];
                              newContacts[idx].position = e.target.value;
                              setFormData({ ...formData, contacts: newContacts });
                            }}
                          />
                        </div>
                      </div>

                      {/* Phone Field */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Số điện thoại liên lạc
                        </label>
                        <div className="relative group/input">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-emerald-500 transition-colors">
                            <Phone size={18} />
                          </div>
                          <Input
                            placeholder="09xx xxx xxx"
                            className="w-full bg-slate-950/50 border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none text-sm font-mono"
                            value={contact.phone}
                            onChange={(e) => {
                              const newContacts = [...(formData.contacts || [])];
                              newContacts[idx].phone = e.target.value;
                              setFormData({ ...formData, contacts: newContacts });
                            }}
                          />
                        </div>
                      </div>

                      {/* Email Field */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Địa chỉ Email
                        </label>
                        <div className="relative group/input">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-emerald-500 transition-colors">
                            <Mail size={18} />
                          </div>
                          <Input
                            placeholder="name@company.com"
                            className="w-full bg-slate-950/50 border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none text-sm font-medium"
                            value={contact.email}
                            onChange={(e) => {
                              const newContacts = [...(formData.contacts || [])];
                              newContacts[idx].email = e.target.value;
                              setFormData({ ...formData, contacts: newContacts });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    contacts: [
                      ...(formData.contacts || []),
                      { name: '', position: '', email: '', phone: '', isPrimary: false },
                    ],
                  })
                }
                className="w-full py-6 border-2 border-dashed border-slate-800/50 rounded-[2rem] text-slate-500 hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-emerald-500/50 transition-all">
                  <Plus size={16} />
                </div>
                Thêm nhân sự liên hệ mới
              </motion.button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-4 pt-8 border-t border-slate-800">
            <Button
              className="px-8 py-3 text-slate-400 font-bold hover:text-white transition-colors"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy bỏ
            </Button>
            <button
              type="submit"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-12 py-4 rounded-[1.25rem] font-black text-sm transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
            >
              LƯU ĐỐI TÁC
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail View Drawer/Modal */}
      <AnimatePresence>
        {isDetailOpen && selectedParty && (
          <Modal
            isOpen={isDetailOpen}
            onClose={() => setIsDetailOpen(false)}
            title={`Hồ Sơ: ${selectedParty.internalCode}`}
            className="max-w-2xl w-full"
          >
            <div className="space-y-8">
              <div className="flex items-center gap-6 pb-6 border-b border-slate-800">
                <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/5">
                  <Building2 size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{selectedParty.name}</h3>
                  <p className="text-slate-400 font-medium">{selectedParty.taxCode || 'Chưa có MST'}</p>
                  <div className="flex gap-2 mt-2">
                    <span
                      className={`px-3 py-0.5 text-[10px] font-black rounded-full border ${getStatusStyle(selectedParty.status)}`}
                    >
                      {selectedParty.status}
                    </span>
                    {selectedParty.isRelatedParty && (
                      <span className="px-3 py-0.5 text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full uppercase">
                        Nội Bộ
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                      Hạn Mức Tín Dụng
                    </label>
                    <p className="text-xl font-bold text-white font-mono">
                      {formatCurrency(selectedParty.creditLimit)}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                      Vai Trò
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedParty.typeTags.map((t) => (
                        <span
                          key={t}
                          className="px-3 py-1 bg-slate-800 text-[11px] font-bold rounded-lg text-slate-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                      Người Phụ Trách
                    </label>
                    <div className="flex items-center gap-2 text-white">
                      <User size={16} className="text-emerald-500" />
                      <span className="font-bold">{selectedParty.personInCharge?.fullName || 'Chưa phân công'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">
                      Người Liên Hệ ({selectedParty.contacts.length})
                    </label>
                    <div className="space-y-4">
                      {selectedParty.contacts.map((c, i) => (
                        <div key={i} className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                          <p className="font-bold text-white text-sm">{c.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{c.position}</p>
                          <p className="text-xs text-emerald-500 mt-2 font-mono">{c.phone}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit History Timeline */}
              <div className="mt-12 border-t border-slate-800 pt-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h4 className="text-lg font-black text-white">Lịch sử hoạt động</h4>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">
                      Audit Trail & Compliance
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-400">
                    {auditLogs.length} Bản ghi
                  </div>
                </div>

                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/50 before:via-slate-800 before:to-transparent">
                  {loadingAudit ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="pl-12 py-4 text-slate-500 text-sm italic">Chưa có lịch sử hoạt động ghi nhận.</div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="relative flex items-start gap-6 group">
                        <div className="absolute left-0 w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center z-10 group-hover:border-emerald-500/50 transition-colors">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              log.action === 'CREATE'
                                ? 'bg-emerald-500'
                                : log.action === 'UPDATE'
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                            } group-hover:scale-125 transition-transform`}
                          />
                        </div>

                        <div className="flex-1 pt-1 ml-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[13px] font-black text-white uppercase tracking-tight">
                              {log.action === 'CREATE'
                                ? 'Khởi tạo đối tác'
                                : log.action === 'UPDATE'
                                  ? 'Cập nhật thông tin'
                                  : log.action === 'TOGGLE_STATUS'
                                    ? `Thay đổi trạng thái: ${log.newValues?.status}`
                                    : log.action}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500">
                              {new Date(log.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Thực hiện bởi <span className="text-emerald-400 font-bold">{log.user?.fullName}</span>
                          </p>
                          {log.reason && (
                            <div className="mt-2 p-2 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-amber-500/80 italic">
                              Lý do: {log.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-12 pt-8 border-t border-slate-800 flex justify-end gap-4">
                <Button
                  appName="web-enterprise"
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm"
                  onClick={() => toast.info('Chức năng chỉnh sửa đang được phát triển')}
                >
                  Chỉnh Sửa
                </Button>
                <Button
                  appName="web-enterprise"
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm"
                  onClick={() => toast.info('Chức năng này đang được phát triển')}
                >
                  Blacklist
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
