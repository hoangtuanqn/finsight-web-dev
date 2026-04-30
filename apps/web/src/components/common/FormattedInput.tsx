import { useEffect, useRef, useState } from 'react';
import { formatDecimalInput, formatIntegerInput, normalizeLocaleNumberInput } from '../../utils/calculations';
import type { LucideIcon } from 'lucide-react';

interface FormattedInputProps {
  kind?: 'integer' | 'decimal';
  value: any;
  onValueChange: (value: string) => void;
  onCommitValue?: (value: string) => void;
  suffix?: string;
  icon?: LucideIcon;
  className?: string;
  placeholder?: string;
  maxValue?: number;
}

export default function FormattedInput({
  kind = 'integer',
  value,
  onValueChange,
  onCommitValue,
  suffix,
  icon: Icon,
  className = '',
  placeholder,
  maxValue = kind === 'integer' ? 100000000000 : undefined,
}: FormattedInputProps) {
  const normalizeInputValue = (rawValue) => (
    kind === 'decimal'
      ? normalizeLocaleNumberInput(rawValue)
      : String(rawValue ?? '').replace(/\D/g, '')
  );

  const clampNormalizedValue = (rawValue) => {
    const normalized = normalizeInputValue(rawValue);
    if (!normalized) return '';
    if (maxValue === undefined) return normalized;

    if (kind === 'decimal') {
      const parsed = Number(normalized);
      if (!Number.isFinite(parsed)) return normalized;
      return String(Math.min(parsed, maxValue));
    }

    const digits = normalized.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    if (!digits) return '';
    return String(Math.min(Number(digits), maxValue));
  };

  const commitValue = (rawValue) => {
    const normalized = clampNormalizedValue(rawValue);
    onValueChange?.(normalized);
    onCommitValue?.(normalized);
    return normalized;
  };

  const normalizedValue = clampNormalizedValue(value);
  const displayValue = kind === 'decimal' ? formatDecimalInput(normalizedValue) : formatIntegerInput(normalizedValue);
  const inputRef = useRef(null);
  const desiredCaretRef = useRef(null);
  const [isComposing, setIsComposing] = useState(false);
  const [draftValue, setDraftValue] = useState(displayValue);

  useEffect(() => {
    if (!isComposing) {
      setDraftValue(displayValue);
    }
  }, [displayValue, isComposing]);

  useEffect(() => {
    if (desiredCaretRef.current === null || !inputRef.current) return;
    const nextCaret = desiredCaretRef.current;
    desiredCaretRef.current = null;
    inputRef.current.setSelectionRange(nextCaret, nextCaret);
  }, [draftValue]);

  const getNormalizedPrefix = (rawValue, caret) => normalizeInputValue(String(rawValue ?? '').slice(0, Math.max(0, caret ?? 0)));

  const toDisplayFromNormalized = (normalized) => (
    kind === 'decimal' ? formatDecimalInput(normalized) : formatIntegerInput(normalized)
  );

  const findCaretPosition = (formattedValue, normalizedPrefix) => {
    if (!normalizedPrefix) return 0;

    for (let i = 0; i <= formattedValue.length; i++) {
      if (normalizeInputValue(formattedValue.slice(0, i)) === normalizedPrefix) {
        return i;
      }
    }

    return formattedValue.length;
  };

  const handleChange = (e) => {
    const rawValue = e.target.value;
    const caret = e.target.selectionStart ?? rawValue.length;

    if (isComposing) {
      setDraftValue(rawValue);
      return;
    }

    const nextValue = clampNormalizedValue(rawValue);
    const nextDisplayValue = toDisplayFromNormalized(nextValue);
    desiredCaretRef.current = findCaretPosition(nextDisplayValue, getNormalizedPrefix(rawValue, caret));
    setDraftValue(nextDisplayValue);
    onValueChange(nextValue);
  };

  const inputMode = kind === 'decimal' ? 'decimal' : 'numeric';

  return (
    <div className="relative group/fmt">
      {Icon && (
        <Icon
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within/fmt:text-blue-500 transition-colors z-10 pointer-events-none"
        />
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode={inputMode}
        value={isComposing ? draftValue : draftValue}
        onChange={handleChange}
        onCompositionStart={() => {
          setIsComposing(true);
          setDraftValue(draftValue || displayValue);
        }}
        onCompositionEnd={(e) => {
          const nextValue = clampNormalizedValue(e.target.value);
          const nextDisplayValue = toDisplayFromNormalized(nextValue);
          setIsComposing(false);
          desiredCaretRef.current = nextDisplayValue.length;
          setDraftValue(nextDisplayValue);
          onValueChange(nextValue);
        }}
        onBlur={() => {
          const nextValue = commitValue(normalizedValue);
          setDraftValue(toDisplayFromNormalized(nextValue));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        className={`${className}${suffix ? ' pr-10' : ''}${Icon ? ' pl-11' : ''}`}
        placeholder={placeholder}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm font-bold z-10">
          {suffix}
        </span>
      )}
    </div>
  );
}
