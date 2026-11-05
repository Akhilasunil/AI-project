import Spinner from './Spinner.jsx';
import { cx } from '../../utils/cx.js';

const variants = {
  primary: 'bg-gradient-to-r from-primary to-secondary text-white shadow-sm shadow-indigo-200 hover:brightness-110',
  secondary: 'border border-line bg-white text-ink hover:bg-slate-50',
  ghost: 'bg-transparent text-ink hover:bg-slate-100',
  danger: 'border border-red-200 bg-white text-danger hover:bg-red-50',
};

export default function Button({
  variant = 'primary',
  type = 'button',
  loading = false,
  loadingLabel,
  className = '',
  disabled,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="h-4 w-4" /> : null}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
