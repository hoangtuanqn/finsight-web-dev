/**
 * Premium glassmorphism Card shell - matches Landing Page aesthetic.
 * Works in both light and dark mode with proper contrast.
 */
export const Card = ({
  children,
  className = "",
  glowColor = "",
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) => (
  <div
    className={`relative rounded-3xl border transition-all duration-300 overflow-hidden ${className}`}
    style={{
      background: "var(--color-bg-card)",
      borderColor: "var(--color-border)",
      boxShadow: glowColor
        ? `var(--shadow-card), 0 0 40px ${glowColor}18`
        : "var(--shadow-card)",
    }}
  >
    {children}
  </div>
);

interface CardHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader = ({
  icon,
  title,
  subtitle,
  action,
}: CardHeaderProps) => (
  <div className="flex items-start justify-between mb-5">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center text-blue-500 shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)] leading-tight tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {action}
  </div>
);
