import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cx } from '../utils/cx.js';

export default function Logo({ to, inverse = false, className = '' }) {
  const content = (
    <>
      <span
        className={cx(
          'grid h-9 w-9 place-items-center rounded-xl',
          inverse ? 'bg-white/15 text-white' : 'bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-indigo-200',
        )}
        aria-hidden="true"
      >
        <Sparkles className="h-5 w-5" />
      </span>
      <span className={cx('text-base font-semibold tracking-tight', inverse ? 'text-white' : 'text-ink')}>
        Company AI
      </span>
    </>
  );

  const classes = cx('inline-flex items-center gap-2.5 rounded-lg', className);

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
