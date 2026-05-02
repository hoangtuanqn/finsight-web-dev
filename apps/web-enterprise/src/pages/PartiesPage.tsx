import { Button, Input } from '@repo/ui';
import { motion } from 'framer-motion';
import { Building2, Filter, Plus, Search } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { enterpriseAuthAPI } from '../api';

// Extracted Components
import { PartiesTable } from './parties/components/PartiesTable';
import { PartyDetailDrawer } from './parties/components/PartyDetailDrawer';
import { PartyFormModal } from './parties/components/PartyFormModal';
import { StatsCards } from './parties/components/StatsCards';
import { StatusReasonModal } from './parties/components/StatusReasonModal';

interface Contact {
  name: string;
  position: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
}

interface Party {
  id: string;
  organizationId: string;
  taxCode: string;
  name: string;
  shortName?: string;
  internalCode: string;
  typeTags: string[];
  creditLimit: number;
  status: string;
  isRelatedParty: boolean;
  contacts: Contact[];
  bankAccounts: BankAccount[];
  personInChargeId?: string;
  personInCharge?: { id: string; fullName: string };
  createdAt: string;
}

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

  useEffect(() => {
    fetchParties();
    fetchInternalUsers();
  }, []);

  const fetchParties = async () => {
    try {
      const res = await (enterpriseAuthAPI as any).getParties({ search });
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
        <button className="flex items-center gap-2 px-5 py-3.5 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 text-sm font-bold hover:bg-slate-800 transition-all">
          <Filter size={18} /> Bộ lọc
        </button>
      </div>

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
