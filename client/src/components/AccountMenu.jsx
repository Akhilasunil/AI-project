import Button from './ui/Button.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { formatRole } from '../utils/format.js';

export default function AccountMenu({ pending, onLogout }) {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 text-right">
        <p className="max-w-40 truncate text-sm font-medium text-ink">{user?.name}</p>
        <p className="text-xs text-muted">{formatRole(user?.role)}</p>
      </div>
      <Button
        variant="secondary"
        onClick={onLogout}
        loading={pending}
        loadingLabel="Signing out..."
        className="shrink-0"
      >
        Sign out
      </Button>
    </div>
  );
}
