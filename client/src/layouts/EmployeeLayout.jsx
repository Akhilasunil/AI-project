import { useCallback, useState } from 'react';
import { BookOpen, FolderKanban, Menu, MessageSquare, CircleUser } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import AccountMenu from '../components/AccountMenu.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import Logo from '../components/Logo.jsx';
import Modal from '../components/ui/Modal.jsx';
import NavigationLink from '../components/NavigationLink.jsx';
import { useLogoutAction } from '../hooks/useLogoutAction.js';

const navigation = [
  { to: '/', label: 'Ask AI', icon: MessageSquare, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban, end: false },
  { to: '/knowledge', label: 'Knowledge', icon: BookOpen, end: false },
  { to: '/profile', label: 'Profile', icon: CircleUser, end: false },
];

export default function EmployeeLayout() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const { onLogout, error, pending } = useLogoutAction();

  return (
    <div className="min-h-screen bg-canvas">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Logo to="/" />
          <nav aria-label="Employee" className="ml-4 hidden md:block">
            <ul className="flex items-center gap-1">
              {navigation.map((item) => (
                <li key={item.to}>
                  <NavigationLink to={item.to} end={item.end} icon={item.icon}>
                    {item.label}
                  </NavigationLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto hidden md:block">
            <AccountMenu pending={pending} onLogout={onLogout} />
          </div>
          <Button
            variant="ghost"
            className="ml-auto px-3 md:hidden"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            onClick={() => setMenuOpen(true)}
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </div>
      </header>

      {error ? (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <main id="main" className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <Modal open={menuOpen} title="Menu" onClose={closeMenu}>
        <p className="mb-3 text-sm text-muted">{user?.name}</p>
        <nav aria-label="Employee">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.to}>
                <NavigationLink to={item.to} end={item.end} icon={item.icon} onClick={closeMenu} className="w-full">
                  {item.label}
                </NavigationLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-4 border-t border-line pt-4">
          <Button variant="secondary" className="w-full" onClick={onLogout} loading={pending} loadingLabel="Signing out...">
            Sign out
          </Button>
        </div>
      </Modal>
    </div>
  );
}
