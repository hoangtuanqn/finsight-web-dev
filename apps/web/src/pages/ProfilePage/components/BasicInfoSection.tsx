import { AlertTriangle, Mail, User } from 'lucide-react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { INPUT_CLASSES, LABEL_CLASSES } from '../constants';

interface BasicInfoSectionProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  user: any;
}

export default function BasicInfoSection({ register, errors, user }: BasicInfoSectionProps) {
  const inputCls = (hasError: any) =>
    `${INPUT_CLASSES} ${hasError ? 'border-red-500/60 focus:border-red-500 ring-2 ring-red-500/10' : 'focus:ring-2 focus:ring-blue-500/10'}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <label className={LABEL_CLASSES}>Họ và tên</label>
        <div className="relative group">
          <User
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-blue-500 transition-colors"
          />
          <input
            {...register('fullName')}
            className={inputCls(errors.fullName) + ' pl-11'}
            placeholder="Nguyễn Văn A"
          />
        </div>
        {errors.fullName && (
          <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1.5 font-medium">
            <AlertTriangle size={12} /> {errors.fullName.message}
          </p>
        )}
      </div>
      <div>
        <label className={LABEL_CLASSES}>Email định danh</label>
        <div className="relative">
          <Mail
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] opacity-50"
          />
          <input
            type="email"
            value={user?.email || ''}
            className={INPUT_CLASSES + ' pl-11 opacity-50 cursor-not-allowed bg-[var(--color-bg-secondary)]/50'}
            disabled
          />
        </div>
      </div>
    </div>
  );
}
