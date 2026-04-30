import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronRight,
  ClipboardList,
  DollarSign,
  GripVertical,
  LineChart as LineChartIcon,
  Plus,
  Play,
  Save,
  Sparkles,
  Trash2,
  Target,
  X,
  Zap,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import {
  useDebts,
  useRepaymentPlanMutations,
  useRepaymentPlans,
  useRepaymentPlanSimulation,
} from "../../hooks/useDebtQuery";
import { PageSkeleton } from "../../components/common/LoadingSpinner";
import FormattedInput from "../../components/common/FormattedInput";
import { formatVND } from "../../utils/calculations";

const TOOLTIP_STYLE = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  padding: "10px 14px",
};

function metricDelta(delta: number, unit: "money" | "month") {
  const abs = Math.abs(delta);
  if (unit === "money") {
    if (delta < 0) return `Tiết kiệm ${formatVND(abs)}`;
    if (delta > 0) return `Tốn thêm ${formatVND(abs)}`;
    return "Ngang bằng";
  }

  if (delta < 0) return `Nhanh hơn ${abs} tháng`;
  if (delta > 0) return `Chậm hơn ${abs} tháng`;
  return "Cùng thời gian";
}

function buildTimeline(simulationData: any) {
  const customSchedule = simulationData?.custom?.schedule || [];
  const avalancheSchedule = simulationData?.avalanche?.schedule || [];
  const snowballSchedule = simulationData?.snowball?.schedule || [];
  const maxMonths = Math.max(
    customSchedule.length,
    avalancheSchedule.length,
    snowballSchedule.length,
  );

  return Array.from({ length: maxMonths }, (_, index) => {
    const custom = customSchedule[index];
    const avalanche = avalancheSchedule[index];
    const snowball = snowballSchedule[index];
    const monthNumber =
      custom?.month ?? avalanche?.month ?? snowball?.month ?? index;

    return {
      month: monthNumber === 0 ? "Hiện tại" : `T${monthNumber}`,
      ...(custom && { custom: custom.totalBalance }),
      ...(avalanche && { avalanche: avalanche.totalBalance }),
      ...(snowball && { snowball: snowball.totalBalance }),
    };
  });
}

function AvailableDebtRow({ debt, onAdd }: { debt: any; onAdd: (id: string) => void }) {
  const debtId = String(debt.id);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
      className="group rounded-2xl border p-3.5 transition-all hover:border-cyan-500/30"
      style={{ background: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/5 text-[var(--color-text-muted)] flex items-center justify-center shrink-0">
          <GripVertical size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <Link to={`/debts/${debt.id}`} className="block text-sm font-black text-[var(--color-text-primary)] truncate hover:text-cyan-300 transition-colors">
            {debt.name}
          </Link>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">
            {debt.platform} · APR {debt.apr}% · Tối thiểu {formatVND(debt.minPayment)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-[var(--color-text-primary)]">{formatVND(debt.balance)}</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">dư nợ</p>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onAdd(debtId)}
          className="w-9 h-9 rounded-xl bg-cyan-500/12 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 transition-colors shrink-0 cursor-pointer"
          title="Thêm vào kế hoạch"
        >
          <Plus size={16} className="mx-auto" />
        </motion.button>
      </div>
    </motion.div>
  );
}

function SelectedDebtItem({ debt, index, onRemove, onMove }: {
  debt: any; index: number;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  const debtId = String(debt.id);

  return (
    <Reorder.Item
      value={debtId}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileDrag={{
        scale: 1.03,
        boxShadow: "0 12px 40px rgba(14,165,233,0.25), 0 0 0 2px rgba(14,165,233,0.4)",
        zIndex: 50,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="rounded-2xl border p-3.5 cursor-grab active:cursor-grabbing"
      style={{
        background: "rgba(14,165,233,0.08)",
        borderColor: "rgba(14,165,233,0.22)",
      }}
    >
      <div className="flex items-center gap-3">
        <motion.div
          className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center text-xs font-black shrink-0 select-none"
          whileHover={{ scale: 1.1, background: "rgba(14,165,233,0.25)" }}
          whileTap={{ scale: 0.95 }}
        >
          {index + 1}
        </motion.div>
        <div className="min-w-0 flex-1">
          <Link to={`/debts/${debt.id}`} className="block text-sm font-black text-[var(--color-text-primary)] truncate hover:text-cyan-300 transition-colors">
            {debt.name}
          </Link>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">
            {debt.platform} · APR {debt.apr}% · Tối thiểu {formatVND(debt.minPayment)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-[var(--color-text-primary)]">{formatVND(debt.balance)}</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">dư nợ</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <motion.button type="button" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
            onClick={() => onMove(debtId, -1)}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)] hover:text-cyan-300 transition-colors cursor-pointer" title="Đưa lên">
            <ArrowUp size={14} className="mx-auto" />
          </motion.button>
          <motion.button type="button" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
            onClick={() => onMove(debtId, 1)}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)] hover:text-cyan-300 transition-colors cursor-pointer" title="Đưa xuống">
            <ArrowDown size={14} className="mx-auto" />
          </motion.button>
          <motion.button type="button" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
            onClick={() => onRemove(debtId)}
            className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/18 text-red-300 transition-colors cursor-pointer" title="Bỏ khỏi kế hoạch">
            <X size={14} className="mx-auto" />
          </motion.button>
        </div>
      </div>
    </Reorder.Item>
  );
}

function MethodPlanCard({
  type,
  debts,
  simulation,
}: {
  type: "AVALANCHE" | "SNOWBALL";
  debts: any[];
  simulation: any;
}) {
  if (!simulation) return null;

  const isAvalanche = type === "AVALANCHE";
  const tone = isAvalanche
    ? {
      name: "Avalanche",
      badge: "Tiết kiệm lãi",
      subtitle: "Ưu tiên trả nợ lãi suất CAO nhất trước",
      text: "text-blue-400",
      border: "rgba(59,130,246,0.25)",
      bg: "rgba(59,130,246,0.06)",
      iconBg: "bg-blue-500/15",
      icon: <Zap size={18} />,
    }
    : {
      name: "Snowball",
      badge: "Động lực tâm lý",
      subtitle: "Ưu tiên trả nợ DƯ NỢ nhỏ nhất trước",
      text: "text-emerald-400",
      border: "rgba(16,185,129,0.25)",
      bg: "rgba(16,185,129,0.06)",
      iconBg: "bg-emerald-500/15",
      icon: <Sparkles size={18} />,
    };

  return (
    <div
      className="relative rounded-3xl p-5 md:p-6 border overflow-hidden"
      style={{
        background: "var(--color-bg-card)",
        borderColor: tone.border,
        boxShadow: `0 4px 20px ${tone.bg}`,
      }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className={`w-10 h-10 rounded-2xl ${tone.iconBg} ${tone.text} flex items-center justify-center`}
        >
          {tone.icon}
        </div>
        <h3 className={`font-black ${tone.text} text-[17px]`}>
          {tone.name}
        </h3>
        <span
          className={`px-2 py-0.5 rounded-full ${tone.iconBg} ${tone.text} text-[10px] font-black`}
        >
          {tone.badge}
        </span>
      </div>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-5">
        {tone.subtitle}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">
            Thời gian
          </p>
          <p className="text-2xl font-black text-[var(--color-text-primary)]">
            {simulation.months}{" "}
            <span className="text-sm text-[var(--color-text-muted)] font-medium">
              tháng
            </span>
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">
            Tổng lãi
          </p>
          <p className="text-xl font-black text-red-400">
            {formatVND(simulation.totalInterest)}
          </p>
        </div>
      </div>

      <div className="h-px bg-white/8 mb-4" />
      <p className={`text-[10px] font-black uppercase tracking-wider mb-3 ${tone.text}`}>
        Thứ tự trả theo phương pháp này
      </p>
      <div className="space-y-2">
        {debts.map((debt, index) => (
          <div key={debt.id} className="flex items-center gap-2.5">
            <div
              className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${index === 0
                ? `${tone.iconBg} ${tone.text}`
                : "bg-white/5 text-[var(--color-text-muted)]"
                }`}
            >
              {index + 1}
            </div>
            <Link
              to={`/debts/${debt.id}`}
              className={`flex-1 text-[12px] font-bold truncate ${index === 0
                ? "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)]"
                } hover:text-cyan-300 transition-colors`}
            >
              {debt.name}
            </Link>
            <span
              className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black ${index === 0
                ? `${tone.iconBg} ${tone.text}`
                : "bg-white/5 text-[var(--color-text-muted)]"
                }`}
            >
              {isAvalanche ? `${debt.apr}% APR` : formatVND(debt.balance)}
            </span>
            {index === 0 && (
              <span className={`shrink-0 text-[10px] font-black ${tone.text}`}>
                ← trước
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CustomRepaymentPlanPage() {
  const navigate = useNavigate();
  const { user } = useAuth() as any;
  const { data: debtsData, isLoading: debtsLoading } = useDebts() as {
    data: any;
    isLoading: boolean;
  };
  const { data: plansData, isLoading: plansLoading } = useRepaymentPlans() as {
    data: any;
    isLoading: boolean;
  };
  const {
    createPlan,
    updatePlan,
    deletePlan,
    isCreatingPlan,
    isUpdatingPlan,
    isDeletingPlan,
  } = useRepaymentPlanMutations();

  const { planId: routePlanId } = useParams<{ planId: string }>();
  const plans = plansData?.plans || [];
  const debts = debtsData?.debts || [];
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState("Kế hoạch trả nợ riêng");
  const [extraBudget, setExtraBudget] = useState(user?.extraBudget || 0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    actionType: "danger" | "primary";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    actionLabel: "",
    actionType: "primary",
    onConfirm: () => { },
  });

  const openConfirm = (options: Omit<typeof confirmDialog, "isOpen">) => {
    setConfirmDialog({ isOpen: true, ...options });
  };


  // Load plan from route param
  useEffect(() => {
    if (routePlanId && routePlanId !== "new" && plans.length > 0) {
      setActivePlanId(routePlanId);
    }
  }, [routePlanId, plans]);

  const activePlan = useMemo(
    () => plans.find((plan: any) => plan.id === activePlanId),
    [activePlanId, plans],
  );
  const debtMap = useMemo(
    () => new Map(debts.map((debt: any) => [String(debt.id), debt])),
    [debts],
  );

  useEffect(() => {
    if (!activePlan) return;
    setPlanName(activePlan.name || "Kế hoạch trả nợ riêng");
    setExtraBudget(activePlan.extraBudget || user?.extraBudget || 0);
    setSelectedIds(
      (activePlan.selectedDebts || [])
        .map((debt: any) => String(debt.id))
        .filter((id: string) => debtMap.has(id)),
    );
  }, [activePlan, debtMap, user?.extraBudget]);

  const selectedDebts = useMemo(
    () => selectedIds.map((id) => debtMap.get(id)).filter(Boolean),
    [debtMap, selectedIds],
  );
  const availableDebts = useMemo(
    () =>
      debts.filter(
        (debt: any) => !selectedIds.includes(String(debt.id)) && debt.balance > 0,
      ),
    [debts, selectedIds],
  );
  const selectedSummary = useMemo(
    () =>
      selectedDebts.reduce(
        (summary: any, debt: any) => ({
          balance: summary.balance + debt.balance,
          minPayment: summary.minPayment + debt.minPayment,
        }),
        { balance: 0, minPayment: 0 },
      ),
    [selectedDebts],
  );
  const avalanchePriority = useMemo(
    () => [...selectedDebts].sort((a: any, b: any) => b.apr - a.apr),
    [selectedDebts],
  );
  const snowballPriority = useMemo(
    () => [...selectedDebts].sort((a: any, b: any) => a.balance - b.balance),
    [selectedDebts],
  );

  const { data: simulationData, isFetching: simulating } =
    useRepaymentPlanSimulation(selectedIds, extraBudget) as {
      data: any;
      isFetching: boolean;
    };

  const chartData = useMemo(() => buildTimeline(simulationData), [simulationData]);

  const addDebt = useCallback((debtId: string) => {
    setSelectedIds((current) =>
      current.includes(debtId) ? current : [...current, debtId],
    );
  }, []);

  const removeDebt = useCallback((debtId: string) => {
    setSelectedIds((current) => current.filter((id) => id !== debtId));
  }, []);

  const addAllDebts = useCallback(() => {
    setSelectedIds((current) => {
      const seen = new Set(current);
      const next = [...current];
      debts.forEach((debt: any) => {
        const debtId = String(debt.id);
        if (debt.balance > 0 && !seen.has(debtId)) {
          seen.add(debtId);
          next.push(debtId);
        }
      });
      return next;
    });
  }, [debts]);

  const clearSelectedDebts = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const moveDebt = useCallback((debtId: string, direction: -1 | 1) => {
    setSelectedIds((current) => {
      const index = current.indexOf(debtId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }, []);



  const sortByAvalanche = useCallback(() => {
    setSelectedIds((current) =>
      [...current].sort(
        (a, b) => (debtMap.get(b)?.apr || 0) - (debtMap.get(a)?.apr || 0),
      ),
    );
  }, [debtMap]);

  const sortBySnowball = useCallback(() => {
    setSelectedIds((current) =>
      [...current].sort(
        (a, b) =>
          (debtMap.get(a)?.balance || 0) - (debtMap.get(b)?.balance || 0),
      ),
    );
  }, [debtMap]);

  const startNewPlan = useCallback(() => {
    setActivePlanId(null);
    setPlanName("Kế hoạch trả nợ");
    setExtraBudget(user?.extraBudget || 0);
    setSelectedIds([]);
  }, [user?.extraBudget]);

  const openNewPlan = useCallback(() => {
    navigate("/debts/plan/new");
    startNewPlan();
  }, [navigate, startNewPlan]);

  const savePlan = useCallback(() => {
    if (selectedIds.length === 0) return;

    openConfirm({
      title: "Lưu bản kế hoạch",
      message: "Bạn có chắc chắn muốn lưu bản kế hoạch này?",
      actionLabel: "Lưu lại",
      actionType: "primary",
      onConfirm: async () => {
        const payload = {
          name: planName.trim() || "Kế hoạch trả nợ riêng",
          extraBudget,
          debtIds: selectedIds,
        };

        if (activePlanId) {
          await updatePlan({ id: activePlanId, data: payload });
          return;
        }

        const res = await createPlan(payload);
        const createdPlan = res?.data?.data?.plan;
        if (createdPlan?.id) {
          setActivePlanId(createdPlan.id);
          navigate(`/debts/plan/${createdPlan.id}`, { replace: true });
        }
      }
    });
  }, [activePlanId, createPlan, extraBudget, navigate, planName, selectedIds, updatePlan]);

  const removePlan = async () => {
    if (!activePlanId) return;

    openConfirm({
      title: "Xóa bản kế hoạch",
      message: "Bạn có chắc chắn muốn xóa bản kế hoạch này? Hành động này không thể hoàn tác.",
      actionLabel: "Xóa bản kế hoạch",
      actionType: "danger",
      onConfirm: async () => {
        await deletePlan(activePlanId);
        navigate("/debts/repayment");
      }
    });
  };

  if (debtsLoading || plansLoading) return <PageSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-8 space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pt-2">
        <div>
          <Link
            to="/debts/repayment"
            className="inline-flex items-center gap-2 text-[12px] font-bold text-[var(--color-text-muted)] hover:text-cyan-300 transition-colors mb-3"
          >
            <ArrowLeft size={14} /> Kế hoạch trả nợ
          </Link>
          <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">
            Lập kế hoạch trả nợ
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1 max-w-2xl">
            Chọn một số khoản nợ, tự sắp thứ tự trả, rồi so sánh với Avalanche
            và Snowball trên đúng nhóm nợ đó.
          </p>
        </div>
      </div>

      <div
        className="rounded-3xl border p-5 md:p-6"
        style={{
          background: "var(--color-bg-card)",
          borderColor: "rgba(14,165,233,0.18)",
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] gap-5">
          <aside className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-[11px] uppercase tracking-widest font-black text-[var(--color-text-muted)]">
                  Toàn bộ khoản nợ
                </p>
                <button
                  type="button"
                  onClick={addAllDebts}
                  disabled={availableDebts.length === 0}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-black hover:bg-cyan-500/16 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={12} /> Thêm tất cả
                </button>
              </div>
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {availableDebts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-2xl border border-white/8 bg-white/4 p-5 text-sm text-[var(--color-text-muted)]"
                  >
                    Tất cả khoản nợ ACTIVE đã nằm trong bản kế hoạch này.
                  </motion.div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {availableDebts.map((debt: any) => (
                      <AvailableDebtRow key={debt.id} debt={debt} onAdd={addDebt} />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </aside>

          <section className="space-y-5 min-w-0">
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-black text-[var(--color-text-muted)] mb-2">
                Tên bản kế hoạch
              </label>
              <input
                value={planName}
                onChange={(event) => setPlanName(event.target.value)}
                className="w-full px-4 py-3 rounded-2xl border bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-bold outline-none focus:border-cyan-500/50"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-[var(--color-text-muted)]">
                  Số khoản chọn
                </p>
                <p className="text-xl font-black text-cyan-300 mt-1">
                  {selectedIds.length}/{debts.length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-[var(--color-text-muted)]">
                  Tổng dư nợ
                </p>
                <p className="text-lg font-black text-[var(--color-text-primary)] mt-1">
                  {formatVND(selectedSummary.balance)}
                </p>
              </div>
            </div>

            <div
              className="relative rounded-3xl p-6 border overflow-hidden"
              style={{
                background: "var(--color-bg-card)",
                borderColor: "rgba(14,165,233,0.15)",
              }}
            >
              <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-10 bg-cyan-500" />
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                  <DollarSign size={16} />
                </div>
                <span className="text-[13px] font-black text-[var(--color-text-primary)]">
                  Ngân sách trả thêm mỗi tháng
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
                <div className="flex-1 relative">
                  <FormattedInput
                    kind="integer"
                    value={extraBudget}
                    onValueChange={(value) =>
                      setExtraBudget(
                        Math.max(0, parseInt(String(value || "0"), 10) || 0),
                      )
                    }
                    maxValue={100000000000}
                    placeholder="Nhập số tiền..."
                    suffix="đ"
                    className="w-full px-4 py-2.5 rounded-xl border bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-cyan-400 font-black text-[14px] outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
                {[
                  { label: "Tối thiểu", value: selectedSummary.minPayment },
                  { label: "Trả thêm", value: extraBudget },
                  { label: "Tổng/tháng", value: selectedSummary.minPayment + extraBudget },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/6 bg-white/4 px-3 py-2.5"
                  >
                    <p className="text-[10px] text-[var(--color-text-muted)] font-black uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="text-[13px] text-[var(--color-text-primary)] font-black mt-1">
                      {formatVND(item.value)}
                    </p>
                  </div>
                ))}
              </div>

              <input
                type="range"
                min="0"
                max="100000000"
                step="500000"
                value={Math.min(extraBudget, 100000000)}
                onChange={(e) => setExtraBudget(+e.target.value)}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1.5">
                <span>0đ</span>
                <span>25tr</span>
                <span>50tr</span>
                <span>75tr</span>
                <span>100tr</span>
              </div>
              {extraBudget > 100000000 && (
                <p className="text-[11px] text-amber-400 mt-2 font-medium">
                  Giá trị vượt thanh kéo - tính toán vẫn dùng đúng số bạn nhập.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={sortByAvalanche}
                disabled={selectedIds.length < 2}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-black hover:bg-blue-500/16 transition-colors disabled:opacity-50"
              >
                <Zap size={14} /> Sắp theo Avalanche
              </button>
              <button
                type="button"
                onClick={sortBySnowball}
                disabled={selectedIds.length < 2}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-black hover:bg-emerald-500/16 transition-colors disabled:opacity-50"
              >
                <Sparkles size={14} /> Sắp theo Snowball
              </button>
              <button
                type="button"
                onClick={savePlan}
                disabled={isCreatingPlan || isUpdatingPlan}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/12 border border-cyan-500/22 text-cyan-200 text-xs font-black hover:bg-cyan-500/18 transition-colors disabled:opacity-50"
              >
                {isCreatingPlan || isUpdatingPlan ? (
                  <span className="w-3.5 h-3.5 border-2 border-cyan-200/30 border-t-cyan-200 rounded-full animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Lưu kế hoạch
              </button>
              {activePlanId && (
                <button
                  type="button"
                  onClick={removePlan}
                  disabled={isDeletingPlan}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-black hover:bg-red-500/16 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} /> Xóa bản này
                </button>
              )}
            </div>

            <div
              className="rounded-3xl border p-4 min-h-[180px]"
              style={{
                background: "rgba(15,23,42,0.35)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-[11px] uppercase tracking-widest font-black text-[var(--color-text-muted)]">
                  Thứ tự trả các khoản nợ (kéo thả để sắp xếp)
                </p>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearSelectedDebts}
                  disabled={selectedIds.length === 0}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-[11px] font-black hover:bg-red-500/16 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <X size={12} /> Xóa tất cả
                </motion.button>
              </div>
              {selectedDebts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-32 rounded-2xl border border-dashed border-cyan-500/25 bg-cyan-500/5 flex items-center justify-center text-sm text-cyan-200/75 text-center px-4"
                >
                  Kéo khoản nợ từ bên trái vào đây hoặc bấm nút thêm.
                </motion.div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={selectedIds}
                  onReorder={setSelectedIds}
                  className="space-y-3"
                >
                  <AnimatePresence mode="popLayout">
                    {selectedDebts.map((debt: any, index: number) => (
                      <SelectedDebtItem
                        key={debt.id}
                        debt={debt}
                        index={index}
                        onRemove={removeDebt}
                        onMove={moveDebt}
                      />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              )}
            </div>
          </section>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
            <div
              className="rounded-3xl border p-5 md:p-6"
              style={{
                background: "var(--color-bg-card)",
                borderColor: "var(--color-border)",
              }}
            >
              <h3 className="text-[14px] font-black text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <LineChartIcon size={16} className="text-blue-400" />
                Tiến trình giảm dư nợ
                {simulating && (
                  <span className="text-[11px] text-[var(--color-text-muted)] font-bold">
                    đang tính...
                  </span>
                )}
              </h3>
              <div className="h-[360px] md:h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.04)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      minTickGap={0}
                      padding={{ left: 18, right: 18 }}
                      tickMargin={8}
                    />
                    <YAxis
                      tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) =>
                        `${(Number(value) / 1000000).toFixed(0)}tr`
                      }
                      width={42}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, _name, entry: any) => {
                        const labels: Record<string, string> = {
                          custom: "Kế hoạch của bạn",
                          avalanche: "Avalanche",
                          snowball: "Snowball",
                        };

                        return [
                          formatVND(Number(value)),
                          labels[String(entry?.dataKey)] || String(_name),
                        ];
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="custom"
                      name="Kế hoạch của bạn"
                      stroke="#f87171"
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="avalanche"
                      name="Avalanche"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="snowball"
                      name="Snowball"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              {simulationData?.custom && (
                <div
                  className="rounded-3xl border p-5"
                  style={{
                    background: "var(--color-bg-card)",
                    borderColor: "rgba(248,113,113,0.28)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-red-500/12 text-red-300 flex items-center justify-center">
                      <Check size={16} />
                    </div>
                    <div>
                      <h3 className="font-black text-[var(--color-text-primary)]">
                        Kết quả Kế hoạch của bạn
                      </h3>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        Tính trên {selectedIds.length} khoản đã chọn
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-[10px] uppercase tracking-widest font-black text-[var(--color-text-muted)]">
                        Thời gian
                      </p>
                      <p className="text-xl font-black text-[var(--color-text-primary)] mt-1">
                        {simulationData.custom.months} tháng
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-[10px] uppercase tracking-widest font-black text-[var(--color-text-muted)]">
                        Tổng lãi
                      </p>
                      <p className="text-lg font-black text-red-300 mt-1">
                        {formatVND(simulationData.custom.totalInterest)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {simulationData?.comparison && (
                <>
                  <div
                    className="rounded-3xl border p-5"
                    style={{
                      background: "rgba(59,130,246,0.07)",
                      borderColor: "rgba(59,130,246,0.20)",
                    }}
                  >
                    <p className="text-[11px] uppercase tracking-widest font-black text-blue-300/80 mb-2">
                      So với Avalanche
                    </p>
                    <p className="text-lg font-black text-blue-200">
                      {metricDelta(
                        simulationData.comparison.customVsAvalanche.interestDelta,
                        "money",
                      )}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      {metricDelta(
                        simulationData.comparison.customVsAvalanche.monthsDelta,
                        "month",
                      )}
                    </p>
                  </div>
                  <div
                    className="rounded-3xl border p-5"
                    style={{
                      background: "rgba(16,185,129,0.07)",
                      borderColor: "rgba(16,185,129,0.20)",
                    }}
                  >
                    <p className="text-[11px] uppercase tracking-widest font-black text-emerald-300/80 mb-2">
                      So với Snowball
                    </p>
                    <p className="text-lg font-black text-emerald-200">
                      {metricDelta(
                        simulationData.comparison.customVsSnowball.interestDelta,
                        "money",
                      )}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      {metricDelta(
                        simulationData.comparison.customVsSnowball.monthsDelta,
                        "month",
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 mt-8">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400">
              <Target size={16} />
            </div>
            <h2 className="text-xl font-black text-[var(--color-text-primary)]">
              Chiến lược trả nợ
            </h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <MethodPlanCard
              type="AVALANCHE"
              debts={avalanchePriority}
              simulation={simulationData?.avalanche}
            />
            <MethodPlanCard
              type="SNOWBALL"
              debts={snowballPriority}
              simulation={simulationData?.snowball}
            />
          </div>
        </>
      )}

      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm rounded-3xl p-6 border shadow-2xl"
              style={{
                background: "var(--color-bg-card)",
                borderColor: "var(--color-border)",
              }}
            >
              <h3 className="text-xl font-black text-[var(--color-text-primary)] mb-2">
                {confirmDialog.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm text-[var(--color-text-muted)] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer ${confirmDialog.actionType === "danger"
                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    : "bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                    }`}
                >
                  {confirmDialog.actionLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
