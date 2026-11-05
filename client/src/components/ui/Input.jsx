import { cx } from '../../utils/cx.js';
import RequiredMark from './RequiredMark.jsx';

export default function Input({
  id,
  label,
  error,
  hint,
  trailing,
  required = false,
  className = '',
  ...props
}) {
  const describedBy = [error ? `${id}-error` : null, !error && hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      <div className="relative">
        <input
          id={id}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy || undefined}
          className={cx(
            'min-h-11 w-full rounded-xl border bg-white px-3.5 text-ink',
            trailing ? 'pr-24' : '',
            error ? 'border-danger' : 'border-line',
          )}
          {...props}
        />
        {trailing ? <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div> : null}
      </div>
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
