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

  const handleChange = (e) => {
    const nextValue = kind === 'decimal'
      ? normalizeLocaleNumberInput(e.target.value)
      : e.target.value.replace(/\D/g, '');
    onValueChange(nextValue);
  };

  const inputMode = kind === 'decimal' ? 'decimal' : 'numeric';

  return (
    <div className="relative">
      <input
        type="text"
        inputMode={inputMode}
        value={displayValue}
        onChange={handleChange}
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
