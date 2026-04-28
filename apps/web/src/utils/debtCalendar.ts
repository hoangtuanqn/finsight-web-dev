/**
 * Debt Calendar utility - lightweight helper for building
 * a monthly calendar focused on debt due dates.
 */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

export function todayKey() {
  const d = new Date();
  return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface DebtEvent {
  debtId: string;
  name: string;
  platform: string;
  amount: number;
  date: string; // YYYY-MM-DD
  balance: number;
}

export interface CalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  events: DebtEvent[];
  totalDue: number;
}

export interface MonthInfo {
  year: number;
  monthIndex: number;
  label: string;
  days: number;
}

export interface DebtCalendarResult {
  month: MonthInfo;
  grid: CalendarDay[];
  totalDebt: number;
  monthlyIncome: number;
  remaining: number;
  debtCount: number;
}

/** Clamp dueDay to the number of days in the month */
function clampDay(dueDay: number, daysInMonth: number) {
  return Math.min(Math.max(1, Math.round(dueDay)), daysInMonth);
}

export function buildDebtCalendar(
  currentMonth: Date,
  debts: any[],
  monthlyIncome: number,
): DebtCalendarResult {
  const year = currentMonth.getFullYear();
  const monthIndex = currentMonth.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = todayKey();

  // Build debt events for this month
  const events: DebtEvent[] = [];
  const activeDebts = debts.filter(
    (d) => !d?.deletedAt && d?.status !== "PAID",
  );

  for (const debt of activeDebts) {
    const dueDay = debt?.dueDay;
    if (!dueDay || dueDay < 1) continue;

    const amount = Number(debt?.minPayment) || 0;
    if (amount <= 0) continue;

    events.push({
      debtId: debt.id,
      name: debt.name || "Khoản nợ",
      platform: debt.platform || "",
      amount,
      date: dateKey(year, monthIndex, clampDay(dueDay, daysInMonth)),
      balance: Number(debt?.balance) || 0,
    });
  }

  // Group events by date
  const byDate: Record<string, DebtEvent[]> = {};
  for (const e of events) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  }

  // Build 6-week grid (42 days), Monday-first
  const firstOfMonth = new Date(year, monthIndex, 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;

  const grid: CalendarDay[] = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(year, monthIndex, i - mondayOffset + 1);
    const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEvents = byDate[key] || [];

    return {
      date: key,
      day: d.getDate(),
      inMonth: d.getMonth() === monthIndex,
      isToday: key === today,
      events: dayEvents,
      totalDue: dayEvents.reduce((s, e) => s + e.amount, 0),
    };
  });

  const totalDebt = events.reduce((s, e) => s + e.amount, 0);

  return {
    month: {
      year,
      monthIndex,
      label: `${MONTH_NAMES[monthIndex]}, ${year}`,
      days: daysInMonth,
    },
    grid,
    totalDebt,
    monthlyIncome,
    remaining: monthlyIncome - totalDebt,
    debtCount: events.length,
  };
}
