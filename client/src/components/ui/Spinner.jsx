import { cx } from '../../utils/cx.js';

export default function Spinner({ label, className = 'h-4 w-4' }) {
  return (
    <span className={cx('inline-flex shrink-0', className)} role={label ? 'status' : undefined}>
      <svg className="h-full w-full animate-spin" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
