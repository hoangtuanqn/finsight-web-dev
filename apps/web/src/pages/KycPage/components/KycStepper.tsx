import { CheckCircle2 } from 'lucide-react';

interface KycStepperProps {
  currentStep: number;
}

const STEPS = [
  { id: 1, label: 'Căn cước công dân' },
  { id: 2, label: 'Khuôn mặt' },
  { id: 3, label: 'Xác nhận' },
];

export default function KycStepper({ currentStep }: KycStepperProps) {
  return (
    <div className="flex items-center justify-between mb-8 relative">
      {/* Progress Line */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[var(--color-bg-secondary)] rounded-full -z-10" />
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full -z-10 transition-all duration-500"
        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
      />

      {STEPS.map((step) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;

        return (
          <div key={step.id} className="flex flex-col items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-[var(--color-bg-card)] transition-colors duration-300 ${
                isCompleted
                  ? 'bg-emerald-500 text-white'
                  : isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_0_4px_rgba(59,130,246,0.2)]'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'
              }`}
            >
              {isCompleted ? <CheckCircle2 size={20} /> : <span className="font-black text-sm">{step.id}</span>}
            </div>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isActive ? 'text-blue-500' : isCompleted ? 'text-emerald-500' : 'text-[var(--color-text-muted)]'
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
