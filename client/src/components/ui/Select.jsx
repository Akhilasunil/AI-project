import { cx } from '../../utils/cx.js';
import RequiredMark from './RequiredMark.jsx';

export default function Select({ id, label, error, hint, required = false, children, className = '', ...props }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      <select
        id={id}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={cx(
          'min-h-11 w-full rounded-xl border bg-white px-3.5 text-ink',
          error ? 'border-danger' : 'border-line',
        )}
        {...props}
      >
        {children}
      </select>
      {hint && !error ? <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">{hint}</p> : null}
      {error ? <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
