import { cx } from '../../utils/cx.js';

const tones = {
  neutral: 'bg-slate-100 text-ink',
  primary: 'bg-indigo-50 text-indigo-900',
  accent: 'bg-teal-50 text-teal-900',
  success: 'bg-green-50 text-green-900',
  warning: 'bg-amber-50 text-amber-950',
};

export default function Badge({ tone = 'neutral', children }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  );
}
