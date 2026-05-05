import { Button, Input } from '@repo/ui';
import { motion } from 'framer-motion';
import { Building2, Filter, History, Plus, Search, ShieldCheck } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { enterpriseAuthAPI } from '../api';
import type { Party } from './parties/types';

// Extracted Components
import { PartiesTable } from './parties/components/PartiesTable';
import { PartyDetailDrawer } from './parties/components/PartyDetailDrawer';
import { PartyFormModal } from './parties/components/PartyFormModal';
import { StatsCards } from './parties/components/StatsCards';
import { StatusReasonModal } from './parties/components/StatusReasonModal';

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [internalUsers, setInternalUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Status Change Logic
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [filters, setFilters] = useState({
    status: '',
    type: '',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Party>>({
    name: '',
    shortName: '',
    taxCode: '',
    typeTags: ['CUSTOMER'],
    creditLimit: 0,
    isRelatedParty: false,
    personInChargeId: '',
    contacts: [{ name: '', position: '', email: '', phone: '', isPrimary: true }],
    bankAccounts: [],
  });

  // Debounced search and filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchParties();
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [search, filters]);

  useEffect(() => {
    fetchInternalUsers();
  }, []);

  const fetchParties = async () => {
    try {
      setIsLoading(true);
      const res = await (enterpriseAuthAPI as any).getParties({
        search,
        status: filters.status || undefined,
        type: filters.type || undefined,
      });
      if (res.data.success) {
        setParties(res.data.data);
      }
    } catch (err) {
      toast.error('Không thể tải danh sách đối tác');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInternalUsers = async () => {
    try {
      const res = await (enterpriseAuthAPI as any).getUsers();
      if (res.data.success) {
        setInternalUsers(res.data.data);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  const fetchAuditLogs = async (id: string) => {
    try {
      const res = await (enterpriseAuthAPI as any).getAuditLogs(id);
      if (res.data.success) {
        setAuditLogs(res.data.data);
      }
    } catch (err) {
      console.error('Fetch audit logs error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!(formData as any).id;
      const res = isEdit
        ? await (enterpriseAuthAPI as any).updateParty((formData as any).id, formData)
        : await (enterpriseAuthAPI as any).createParty(formData);

      if (res.data.success) {
        toast.success(isEdit ? 'Đã cập nhật đối tác thành công' : 'Đã tạo đối tác thành công');
        setIsModalOpen(false);
        fetchParties();
        resetForm();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi lưu đối tác');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      shortName: '',
      taxCode: '',
      typeTags: ['CUSTOMER'],
      creditLimit: 0,
      isRelatedParty: false,
      personInChargeId: '',
      contacts: [{ name: '', position: '', email: '', phone: '', isPrimary: true }],
      bankAccounts: [],
    });
  };

  const handleToggleStatus = (party: Party, status: string) => {
    setSelectedParty(party);
    setPendingStatus(status);
    setStatusReason('');
    setIsStatusModalOpen(true);
    setIsDetailOpen(false); // Tự động đóng thanh bên
  };

  const confirmStatusChange = async () => {
    if (!selectedParty || !pendingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const res = await (enterpriseAuthAPI as any).togglePartyStatus(selectedParty.id, {
        status: pendingStatus,
        reason: statusReason,
      });
      if (res.data.success) {
        toast.success(`Đã chuyển trạng thái sang ${getStatusLabel(pendingStatus)}`);
        setIsStatusModalOpen(false);
        fetchParties();
        if (isDetailOpen) fetchAuditLogs(selectedParty.id);
      }
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Đang hoạt động';
      case 'INACTIVE':
        return 'Ngừng hoạt động';
      case 'BLACKLIST':
        return 'Danh sách đen';
      default:
        return status;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'INACTIVE':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'BLACKLIST':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const stats = useMemo(() => {
    const total = parties.length;
    const active = parties.filter((p) => p.status === 'ACTIVE').length;
    const totalCreditLimit = parties.reduce((acc, p) => acc + p.creditLimit, 0);
    const roleCounts = parties.reduce((acc: any, p) => {
      p.typeTags.forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
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
      icon: Building2,
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
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} /> Thêm Đối Tác
          </Button>
        </div>
      </div>

      <StatsCards cards={SUMMARY_CARDS as any} />

      {/* ── Filter & Search ── */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
            <Search size={18} />
          </div>
          <Input
            placeholder="Tìm kiếm theo tên, mã đối tác hoặc MST..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border-slate-800 rounded-2xl text-sm focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchParties()}
          />
        </div>
        <button
          onClick={() => setIsFilterOpen(true)}
          className={`flex items-center gap-2 px-5 py-3.5 border rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
            filters.status || filters.type
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Filter size={18} />
          {filters.status || filters.type ? 'Đang lọc' : 'Bộ lọc'}
        </button>
      </div>

      {/* ── Filter Sidebar ── */}
      {isFilterOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFilterOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl z-[101] flex flex-col"
          >
            <div className="p-8 flex items-center justify-between border-b border-slate-800/50 bg-slate-950/20">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Filter className="text-emerald-500" size={20} />
                  Bộ lọc đối tác
                </h2>
                <p className="text-slate-500 text-xs mt-1">Tìm kiếm đối tác theo các tiêu chí</p>
              </div>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {/* Status Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trạng thái</label>
                  {filters.status && (
                    <button
                      onClick={() => setFilters({ ...filters, status: '' })}
                      className="text-[10px] text-emerald-500 font-bold hover:underline"
                    >
                      Xoá chọn
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { id: 'ACTIVE', label: 'Đang hoạt động', color: 'bg-emerald-500' },
                    { id: 'INACTIVE', label: 'Ngừng hoạt động', color: 'bg-amber-500' },
                    { id: 'BLACKLIST', label: 'Danh sách đen', color: 'bg-rose-500' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setFilters({ ...filters, status: s.id })}
                      className={`group flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                        filters.status === s.id
                          ? 'bg-slate-800 text-white shadow-xl ring-1 ring-slate-700'
                          : 'bg-slate-950/30 text-slate-500 border border-slate-800 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${filters.status === s.id ? s.color : 'bg-slate-800'} transition-all`}
                      />
                      {s.label}
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={14} className="text-slate-600" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Vai trò đối tác
                  </label>
                  {filters.type && (
                    <button
                      onClick={() => setFilters({ ...filters, type: '' })}
                      className="text-[10px] text-blue-500 font-bold hover:underline"
                    >
                      Xoá chọn
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { id: 'CUSTOMER', label: 'Khách hàng', icon: '👤' },
                    { id: 'SUPPLIER', label: 'Nhà cung cấp', icon: '🚚' },
                    { id: 'BANK', label: 'Ngân hàng', icon: '🏦' },
                    { id: 'STATE', label: 'Cơ quan nhà nước', icon: '🏛️' },
                    { id: 'INTERNAL', label: 'Nội bộ', icon: '🏠' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setFilters({ ...filters, type: t.id })}
                      className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                        filters.type === t.id
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-slate-950/30 text-slate-500 border border-slate-800 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-lg grayscale group-hover:grayscale-0">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-800/50 bg-slate-950/20 space-y-4">
              {(filters.status || filters.type) && (
                <Button
                  appName="web-enterprise"
                  onClick={() => setFilters({ status: '', type: '' })}
                  className="w-full py-3 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all text-xs uppercase tracking-widest border border-slate-700"
                >
                  Xoá tất cả bộ lọc
                </Button>
              )}
              <Button
                appName="web-enterprise"
                onClick={() => setIsFilterOpen(false)}
                className="w-full py-4 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all uppercase tracking-widest text-xs"
              >
                Áp dụng & Đóng
              </Button>
            </div>
          </motion.div>
        </>
      )}

      <PartiesTable
        parties={parties}
        onRowClick={(party) => {
          setSelectedParty(party);
          setIsDetailOpen(true);
          fetchAuditLogs(party.id);
        }}
        onToggleStatus={handleToggleStatus}
        getStatusStyle={getStatusStyle}
        getStatusLabel={getStatusLabel}
        formatCurrency={formatCurrency}
      />

      {/* Modals & Drawers */}
      <PartyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        internalUsers={internalUsers}
        isEdit={!!(formData as any).id}
      />

      <PartyDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        party={selectedParty}
        auditLogs={auditLogs}
        onEdit={() => {
          setFormData({ ...selectedParty });
          setIsModalOpen(true);
          setIsDetailOpen(false); // Tự động đóng thanh bên
        }}
        onToggleStatus={(status) => handleToggleStatus(selectedParty!, status)}
        formatCurrency={formatCurrency}
        getStatusStyle={getStatusStyle}
        getStatusLabel={getStatusLabel}
      />

      <StatusReasonModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={confirmStatusChange}
        pendingStatus={pendingStatus || ''}
        reason={statusReason}
        setReason={setStatusReason}
        isUpdatingStatus={isUpdatingStatus}
        getStatusLabel={getStatusLabel}
      />
    </motion.div>
  );
}
