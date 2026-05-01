import { motion, Reorder } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Plus,
  X,
} from "lucide-react";
import { formatVND } from "../../../utils/calculations";

export function AvailableDebtRow({
  debt,
  onAdd,
}: {
  debt: any;
  onAdd: (id: string) => void;
}) {
  const debtId = String(debt.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
      className="group rounded-2xl border p-3.5 transition-all hover:border-cyan-500/30"
      style={{
        background: "var(--color-bg-secondary)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/5 text-[var(--color-text-muted)] flex items-center justify-center shrink-0">
          <GripVertical size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <Link
            to={`/debts/${debt.id}`}
            className="block text-sm font-black text-[var(--color-text-primary)] truncate hover:text-cyan-300 transition-colors"
          >
            {debt.name}
          </Link>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">
            {debt.platform} · APR {debt.apr}% · Tối thiểu{" "}
            {formatVND(debt.minPayment)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-[var(--color-text-primary)]">
            {formatVND(debt.balance)}
          </p>
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

export function SelectedDebtItem({
  debt,
  index,
  onRemove,
  onMove,
}: {
  debt: any;
  index: number;
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
        boxShadow:
          "0 12px 40px rgba(14,165,233,0.25), 0 0 0 2px rgba(14,165,233,0.4)",
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
          <Link
            to={`/debts/${debt.id}`}
            className="block text-sm font-black text-[var(--color-text-primary)] truncate hover:text-cyan-300 transition-colors"
          >
            {debt.name}
          </Link>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">
            {debt.platform} · APR {debt.apr}% · Tối thiểu{" "}
            {formatVND(debt.minPayment)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-[var(--color-text-primary)]">
            {formatVND(debt.balance)}
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)]">dư nợ</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <IconButton title="Đưa lên" onClick={() => onMove(debtId, -1)}>
            <ArrowUp size={14} className="mx-auto" />
          </IconButton>
          <IconButton title="Đưa xuống" onClick={() => onMove(debtId, 1)}>
            <ArrowDown size={14} className="mx-auto" />
          </IconButton>
          <IconButton
            title="Bỏ khỏi kế hoạch"
            onClick={() => onRemove(debtId)}
            className="bg-red-500/10 hover:bg-red-500/18 text-red-300"
          >
            <X size={14} className="mx-auto" />
          </IconButton>
        </div>
      </div>
    </Reorder.Item>
  );
}

function IconButton({
  title,
  onClick,
  className = "bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)] hover:text-cyan-300",
  children,
}: {
  title: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      className={`w-8 h-8 rounded-xl transition-colors cursor-pointer ${className}`}
      title={title}
    >
      {children}
    </motion.button>
  );
}
