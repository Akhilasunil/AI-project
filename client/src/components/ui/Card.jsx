import { cx } from '../../utils/cx.js';

export default function Card({ className = '', children }) {
  return <div className={cx('rounded-2xl border border-line bg-card p-6 shadow-sm', className)}>{children}</div>;
}
