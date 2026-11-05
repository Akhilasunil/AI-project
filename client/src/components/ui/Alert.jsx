import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cx } from '../../utils/cx.js';

const tones = {
  error: {
    className: 'border-red-200 bg-red-50 text-red-950',
    icon: AlertCircle,
    role: 'alert',
  },
  success: {
    className: 'border-green-200 bg-green-50 text-green-950',
    icon: CheckCircle2,
    role: 'status',
  },
  warning: {
    className: 'border-amber-200 bg-amber-50 text-amber-950',
    icon: AlertTriangle,
    role: 'status',
  },
  info: {
    className: 'border-line bg-white text-ink',
    icon: Info,
    role: 'status',
  },
};

export default function Alert({ tone = 'info', children }) {
  const config = tones[tone];
  const Icon = config.icon;

  return (
    <div role={config.role} className={cx('flex gap-3 rounded-xl border px-4 py-3 text-sm', config.className)}>
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
