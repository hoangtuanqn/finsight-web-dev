import { CheckCircle2 } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between mb-8 relative w-full max-w-[280px] mx-auto">
      {/* Background Line */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-slate-800 -z-10 rounded-full" />

      {/* Progress Line */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 -z-10 rounded-full transition-all duration-500"
        style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
      />

      {steps.map((s) => (
        <div
          key={s}
          className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-[13px] transition-all duration-300 border-2 
            ${
              currentStep >= s
                ? 'bg-white dark:bg-slate-900 border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600'
            }`}
        >
          {currentStep > s ? <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white" /> : <span>{s}</span>}
        </div>
      ))}
    </div>
  );
}
