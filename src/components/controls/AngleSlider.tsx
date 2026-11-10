import { useId } from 'react';
import './controls.css';

interface Props {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly unit?: string;
  readonly decimals?: number;
  readonly onChange: (value: number) => void;
  readonly hint?: string;
  readonly accent?: 'cyan' | 'red' | 'amber';
  readonly disabled?: boolean;
}

/**
 * Synchronised slider + numeric field. The numeric field is the source of
 * truth for exact entry; the slider provides the continuous feel.
 */
export function AngleSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '°',
  decimals = 1,
  onChange,
  hint,
  accent = 'cyan',
  disabled = false,
}: Props) {
  const id = useId();
  const clamped = Math.min(max, Math.max(min, value));

  const commit = (raw: string) => {
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return;
    onChange(Math.min(max, Math.max(min, parsed)));
  };

  return (
    <div className={`ctrl ctrl--${accent}${disabled ? ' is-disabled' : ''}`}>
      <div className="ctrl__head">
        <label htmlFor={id} className="ctrl__label">
          {label}
        </label>
        <div className="ctrl__numeric">
          <input
            id={id}
            type="number"
            className="numeric"
            value={Number(clamped.toFixed(decimals))}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={(event) => commit(event.target.value)}
            aria-label={`${label} numeric value in ${unit === '°' ? 'degrees' : unit}`}
          />
          <span className="ctrl__unit">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        className="ctrl__range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={`${label} slider`}
        aria-valuetext={`${clamped.toFixed(decimals)} ${unit}`}
      />
      <div className="ctrl__scale">
        <span>{min}{unit}</span>
        {hint && <span className="ctrl__hint">{hint}</span>}
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

interface ToggleProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly description?: string;
  readonly onLabel?: string;
  readonly offLabel?: string;
  readonly accent?: 'cyan' | 'red';
}

export function Toggle({
  label,
  checked,
  onChange,
  description,
  onLabel = 'ON',
  offLabel = 'OFF',
  accent = 'cyan',
}: ToggleProps) {
  return (
    <div className={`toggle toggle--${accent}`}>
      <div className="toggle__text">
        <span className="toggle__label">{label}</span>
        {description && <span className="toggle__desc">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`toggle__switch${checked ? ' is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle__knob" />
        <span className="toggle__state">{checked ? onLabel : offLabel}</span>
      </button>
    </div>
  );
}

interface SegmentedProps<T extends string> {
  readonly label: string;
  readonly options: readonly { readonly value: T; readonly label: string; readonly hint?: string }[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly size?: 'sm' | 'md';
}

export function Segmented<T extends string>({ label, options, value, onChange, size = 'md' }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      <span className="label segmented__label">{label}</span>
      <div className="segmented__track">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`segmented__option${option.value === value ? ' is-active' : ''} segmented__option--${size}`}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            title={option.hint}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface SelectProps {
  readonly label: string;
  readonly value: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly onChange: (value: string) => void;
  readonly hint?: string;
}

export function LabSelect({ label, value, options, onChange, hint }: SelectProps) {
  return (
    <div className="lab-select">
      <label className="label" htmlFor={`select-${label.replace(/\s+/g, '-')}`}>
        {label}
      </label>
      <select
        id={`select-${label.replace(/\s+/g, '-')}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="lab-select__hint">{hint}</p>}
    </div>
  );
}
