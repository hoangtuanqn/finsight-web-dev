import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, Landmark, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { debtAPI, userAPI } from '../../api';
import { buildDebtCalendar, dateKey, type DebtEvent } from '../../utils/debtCalendar';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function compactVND(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${Math.round(v / 1_000_000_000)}tỷ`;
  if (abs >= 1_000_000) return `${Math.round(v / 1_000_000)}tr`;
  if (abs >= 1_000) return `${Math.round(v / 1_000)}k`;
  return `${Math.round(v)}đ`;
}

export default function DebtCalendarPopover({
  open,
  onClose,
  isMobile,
  user,
}: {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
  user?: any;
}) {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
  });

  // Fetch debts
  const debtQuery = useQuery({
    queryKey: ['debt-calendar', 'debts'],
    queryFn: async () => {
      const res = await debtAPI.getAll({ status: 'ACTIVE' });
      const data = res.data.data;
      return Array.isArray(data) ? data : data?.debts || [];
    },
    enabled: open,
    staleTime: 60_000,
  });

  // Fetch profile for monthlyIncome
  const profileQuery = useQuery({
    queryKey: ['debt-calendar', 'profile'],
    queryFn: async () => {
      const res = await userAPI.getProfile();
      return res.data.data?.user || res.data.data;
    },
    enabled: open,
    staleTime: 60_000,
  });

  const monthlyIncome = Number(profileQuery.data?.monthlyIncome || user?.monthlyIncome) || 0;

  const calendar = useMemo(
    () => buildDebtCalendar(currentMonth, debtQuery.data || [], monthlyIncome),
    [currentMonth, debtQuery.data, monthlyIncome],
  );

  // Sync selected date when month changes
  const selectedMonth = selectedDate.slice(0, 7);
  const currentMonthKey = `${calendar.month.year}-${String(calendar.month.monthIndex + 1).padStart(2, '0')}`;
  if (selectedMonth !== currentMonthKey) {
    setSelectedDate(dateKey(calendar.month.year, calendar.month.monthIndex, 1));
  }

  const selectedDay = calendar.grid.find((d) => d.date === selectedDate);

  const changeMonth = (offset: number) => {
    setCurrentMonth((p) => new Date(p.getFullYear(), p.getMonth() + offset, 1));
  };

  const isLoading = debtQuery.isLoading || profileQuery.isLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.14 }}
      className={
        isMobile
          ? 'fixed left-3 right-3 top-[72px] z-[220] max-h-[calc(100vh-88px)] overflow-hidden rounded-2xl border'
          : 'absolute right-0 top-[calc(100%+8px)] z-[220] w-[min(420px,calc(100vw-24px))] max-h-[min(80vh,680px)] overflow-hidden rounded-2xl border'
      }
      style={{
        background: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 24px 70px rgba(0,0,0,0.48)',
      }}
    >
      <div className="max-h-[inherit] overflow-y-auto">
        {/* ─── Header ─── */}
        <div className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/95 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                <CalendarDays size={16} />
              </div>
              <p className="text-[14px] font-black text-[var(--color-text-primary)]">{calendar.month.label}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => changeMonth(-1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-blue-300"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-blue-300"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-3">
          {/* ─── Summary Cards ─── */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.07] px-2.5 py-2">
              <div className="mb-0.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                <TrendingUp size={10} /> Thu nhập
              </div>
              <p className="truncate text-[12px] font-black text-[var(--color-text-primary)]">
                {compactVND(monthlyIncome)}
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.07] px-2.5 py-2">
              <div className="mb-0.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-300">
                <TrendingDown size={10} /> Nợ trả
              </div>
              <p className="truncate text-[12px] font-black text-[var(--color-text-primary)]">
                {compactVND(calendar.totalDebt)}
              </p>
            </div>
            <div
              className={`rounded-xl border px-2.5 py-2 ${
                calendar.remaining < 0 ? 'border-red-500/20 bg-red-500/[0.07]' : 'border-blue-500/20 bg-blue-500/[0.07]'
              }`}
            >
              <div
                className={`mb-0.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider ${
                  calendar.remaining < 0 ? 'text-red-300' : 'text-blue-300'
                }`}
              >
                <Wallet size={10} /> Còn lại
              </div>
              <p className="truncate text-[12px] font-black text-[var(--color-text-primary)]">
                {compactVND(calendar.remaining)}
              </p>
            </div>
          </div>

          {/* ─── Calendar Grid ─── */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2.5">
            {/* Weekday headers */}
            <div className="mb-1.5 grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-[10px] font-black text-[var(--color-text-muted)]">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendar.grid.map((day) => {
                const isSelected = day.date === selectedDate;
                const hasDue = day.events.length > 0;

                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={`relative min-h-[36px] rounded-lg border p-0.5 text-center transition-all ${
                      isSelected
                        ? 'border-blue-400/50 bg-blue-500/[0.12]'
                        : hasDue
                          ? 'border-amber-500/25 bg-amber-500/[0.06] hover:bg-amber-500/[0.1]'
                          : 'border-transparent hover:border-white/10 hover:bg-white/[0.04]'
                    } ${day.inMonth ? 'opacity-100' : 'opacity-30'}`}
                  >
                    <span
                      className={`block text-[11px] font-bold ${
                        day.isToday ? 'font-black text-cyan-300' : 'text-[var(--color-text-primary)]'
                      }`}
                    >
                      {day.day}
                    </span>
                    {hasDue && (
                      <div className="mt-0.5 flex items-center justify-center gap-0.5">
                        {day.events.slice(0, 3).map((e) => (
                          <span key={e.debtId} className="h-1 w-1 rounded-full bg-amber-400" />
                        ))}
                      </div>
                    )}
                    {day.totalDue > 0 && (
                      <p className="mt-0.5 text-[7px] font-bold text-amber-300/80">-{compactVND(day.totalDue)}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Day Detail ─── */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12px] font-black text-[var(--color-text-primary)]">
                Ngày {selectedDate.slice(8, 10)}
              </p>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-[var(--color-text-secondary)]">
                {selectedDay?.events.length || 0} khoản
              </span>
            </div>

            <div className="space-y-1.5">
              {isLoading ? (
                <p className="py-4 text-center text-[11px] font-bold text-[var(--color-text-muted)]">Đang tải...</p>
              ) : selectedDay && selectedDay.events.length > 0 ? (
                selectedDay.events.map((e: DebtEvent) => (
                  <button
                    key={e.debtId}
                    onClick={() => {
                      onClose();
                      navigate(`/debts/${e.debtId}`);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.06] px-3 py-2 text-left transition-colors hover:bg-amber-500/[0.12]"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300">
                      <Landmark size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-[var(--color-text-primary)]">{e.name}</p>
                      <p className="text-[9px] font-medium text-[var(--color-text-muted)]">
                        {e.platform}
                        {e.balance > 0 && ` · Dư nợ: ${compactVND(e.balance)}`}
                      </p>
                    </div>
                    <p className="shrink-0 text-[12px] font-black text-amber-300">-{compactVND(e.amount)}</p>
                  </button>
                ))
              ) : (
                <p className="py-4 text-center text-[11px] font-bold text-[var(--color-text-muted)]">
                  Không có khoản nợ đến hạn
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
