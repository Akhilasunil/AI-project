import Spinner from './Spinner.jsx';
import { cx } from '../../utils/cx.js';

const variants = {
  default: 'border-line bg-white text-muted hover:border-primary hover:bg-indigo-50 hover:text-primary',
  danger: 'border-red-100 bg-white text-danger hover:border-red-300 hover:bg-red-50',
};

export default function IconButton({ icon: Icon, label, variant = 'default', loading = false, className = '', ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={loading || props.disabled}
      className={cx(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className="h-4 w-4" /> : <Icon aria-hidden="true" className="h-4 w-4" />}
    </button>
  );
}
