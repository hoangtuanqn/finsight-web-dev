import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui';
import { History, ShieldAlert, User } from 'lucide-react';
import React from 'react';

interface Party {
  id: string;
  internalCode: string;
  name: string;
  shortName?: string;
  taxCode: string;
  typeTags: string[];
  creditLimit: number;
  status: string;
  isRelatedParty: boolean;
}

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
    <div className="bg-slate-900/40 border border-slate-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl">
      <Table>
        <TableHeader className="bg-slate-950/40">
          <TableRow className="border-slate-800 hover:bg-transparent">
            <TableHead className="pl-8 font-bold text-slate-300">Thông tin Đối Tác</TableHead>
            <TableHead className="font-bold text-slate-300">Mã Số / MST</TableHead>
            <TableHead className="font-bold text-slate-300">Vai Trò</TableHead>
            <TableHead className="text-right font-bold text-slate-300">Hạn Mức</TableHead>
            <TableHead className="font-bold text-slate-300">Trạng Thái</TableHead>
            <TableHead className="font-bold text-slate-300 text-right pr-6">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parties.map((party) => (
            <TableRow
              key={party.id}
              className="border-slate-800/50 hover:bg-emerald-500/[0.02] transition-all cursor-pointer group"
              onClick={() => onRowClick(party)}
            >
              <TableCell className="pl-8 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-slate-700/50 group-hover:border-emerald-500/30 transition-all shadow-lg">
                    <User size={20} className="text-slate-400 group-hover:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white group-hover:text-emerald-400 transition-colors leading-tight">
                      {party.name}
                    </p>
                    {party.shortName && <p className="text-xs text-slate-500 font-medium mt-0.5">{party.shortName}</p>}
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
                  {getStatusLabel(party.status)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleStatus(party, party.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border border-slate-800 transition-all ${
                      party.status === 'ACTIVE'
                        ? 'text-slate-400 hover:text-amber-500 hover:border-amber-500/30 hover:bg-amber-500/5'
                        : 'text-slate-400 hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/5'
                    }`}
                    title="Đổi trạng thái"
                  >
                    <History size={18} />
                  </button>
                  <button
                    onClick={() => onToggleStatus(party, 'BLACKLIST')}
                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/5 border border-slate-800 rounded-xl transition-all"
                    title="Đưa vào Blacklist"
                  >
                    <ShieldAlert size={18} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
