import { NavLink } from 'react-router-dom';
import { cx } from '../utils/cx.js';

export default function NavigationLink({ to, end = false, icon: Icon, children, onClick, className = '' }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cx(
          'flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium',
          isActive ? 'bg-gradient-to-r from-indigo-50 to-sky-50 text-primary ring-1 ring-indigo-100' : 'text-muted hover:bg-slate-50 hover:text-ink',
          className,
        )
      }
    >
      {Icon ? <Icon aria-hidden="true" className="h-4 w-4 shrink-0" /> : null}
      {children}
    </NavLink>
  );
}
