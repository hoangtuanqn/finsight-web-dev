import { useEffect, useState } from 'react';
import { formatDecimalInput, formatIntegerInput, normalizeLocaleNumberInput } from '../../utils/calculations';

export default function FormattedInput({
  kind = 'integer',
  value,
  onValueChange,
  suffix,
  className = '',
  placeholder,
}) {
  const displayValue = kind === 'decimal' ? formatDecimalInput(value) : formatIntegerInput(value);
  const [isComposing, setIsComposing] = useState(false);
  const [draftValue, setDraftValue] = useState(displayValue);

  useEffect(() => {
    if (!isComposing) {
      setDraftValue(displayValue);
    }
  }, [displayValue, isComposing]);

  const normalizeInputValue = (rawValue) => (
    kind === 'decimal'
      ? normalizeLocaleNumberInput(rawValue)
      : rawValue.replace(/\D/g, '')
  );

  const handleChange = (e) => {
    const rawValue = e.target.value;

    if (isComposing) {
      setDraftValue(rawValue);
      return;
    }

    const nextValue = normalizeInputValue(rawValue);
    onValueChange(nextValue);
  };

  const inputMode = kind === 'decimal' ? 'decimal' : 'numeric';

  return (
    <div className="relative">
      <input
        type="text"
        inputMode={inputMode}
        value={isComposing ? draftValue : displayValue}
        onChange={handleChange}
        onCompositionStart={() => {
          setIsComposing(true);
          setDraftValue(displayValue);
        }}
        onCompositionEnd={(e) => {
          const nextValue = normalizeInputValue(e.target.value);
          setIsComposing(false);
          setDraftValue(kind === 'decimal' ? formatDecimalInput(nextValue) : formatIntegerInput(nextValue));
          onValueChange(nextValue);
        }}
        className={`${className}${suffix ? ' pr-10' : ''}`}
        placeholder={placeholder}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm font-bold">
          {suffix}
        </span>
      )}
    </div>
  );
}
