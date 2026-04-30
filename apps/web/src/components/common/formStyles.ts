export const FORM_INPUT_CLASSES =
  "w-full px-4 py-2.5 rounded-xl border bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] text-sm outline-none focus:border-blue-500/60 transition-colors";

export const FORM_LABEL_CLASSES =
  "block text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5";

export function formInputClass(hasError?: unknown) {
  return `${FORM_INPUT_CLASSES} ${
    hasError
      ? "border-red-500/60 focus:border-red-500 ring-2 ring-red-500/10"
      : "focus:ring-2 focus:ring-blue-500/10"
  }`;
}
