import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui';
import { History, Search, ShieldAlert, User } from 'lucide-react';
import React from 'react';
import type { Party } from '../types';

interface PartiesTableProps {
  parties: Party[];
  onRowClick: (party: Party) => void;
  onToggleStatus: (party: Party, status: string) => void;
  getStatusStyle: (status: string) => string;
  getStatusLabel: (status: string) => string;
  formatCurrency: (amount: number) => string;
}

export const PartiesTable: React.FC<PartiesTableProps> = ({
  parties,
  onRowClick,
  onToggleStatus,
  getStatusStyle,
  getStatusLabel,
  formatCurrency,
}) => {
  return (
    <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-sm dark:shadow-2xl">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-950/40">
          <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
            <TableHead className="pl-8 font-bold text-slate-600 dark:text-slate-300">Thông tin Đối Tác</TableHead>
            <TableHead className="font-bold text-slate-600 dark:text-slate-300">Mã Số / MST</TableHead>
            <TableHead className="font-bold text-slate-600 dark:text-slate-300">Vai Trò</TableHead>
            <TableHead className="text-right font-bold text-slate-600 dark:text-slate-300">Hạn Mức</TableHead>
            <TableHead className="font-bold text-slate-600 dark:text-slate-300">Trạng Thái</TableHead>
            <TableHead className="font-bold text-slate-600 dark:text-slate-300 text-right pr-6">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parties.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="py-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="w-20 h-20 rounded-[2rem] bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center border border-slate-200 dark:border-slate-700/50 text-slate-400 dark:text-slate-500 shadow-sm">
                    <Search size={36} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-900 dark:text-white font-black text-xl">Không tìm thấy đối tác</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[300px] mx-auto">
                      Vui lòng thử lại với từ khóa hoặc bộ lọc khác để tìm thấy kết quả phù hợp.
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            parties.map((party) => (
              <TableRow
                key={party.id}
                className="border-slate-100 dark:border-slate-800/50 hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-500/[0.02] transition-all cursor-pointer group"
                onClick={() => onRowClick(party)}
              >
                <TableCell className="pl-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700/50 group-hover:border-emerald-500/30 transition-all shadow-sm dark:shadow-lg">
                      <User size={20} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                        {party.name}
                      </p>
                      {party.shortName && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 uppercase tracking-tighter">
                          {party.shortName}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-mono">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      {party.internalCode}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                      {party.taxCode || 'Chưa cập nhật MST'}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {party.typeTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 bg-slate-100/80 dark:bg-slate-800 text-[9px] font-black rounded-lg text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-widest"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <p className="font-mono text-[14px] font-black text-slate-900 dark:text-white">
                    {formatCurrency(party.creditLimit)}
                  </p>
                  {party.isRelatedParty && (
                    <span className="text-[9px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-500 px-1.5 py-0.5 rounded uppercase mt-1 inline-block border border-amber-500/20">
                      Bên Liên Quan
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-3 py-1 text-[11px] font-black rounded-full border shadow-sm ${getStatusStyle(party.status)}`}
                  >
                    {getStatusLabel(party.status)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleStatus(party, party.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm dark:shadow-none ${
                        party.status === 'ACTIVE'
                          ? 'text-slate-400 hover:text-amber-500 hover:border-amber-500/30 hover:bg-amber-500/10'
                          : 'text-slate-400 hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/10'
                      }`}
                      title="Đổi trạng thái"
                    >
                      <History size={18} />
                    </button>
                    <button
                      onClick={() => onToggleStatus(party, 'BLACKLIST')}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm dark:shadow-none"
                      title="Đưa vào Blacklist"
                    >
                      <ShieldAlert size={18} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
