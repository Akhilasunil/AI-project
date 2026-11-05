import { useCallback, useState } from 'react';
import { CircleHelp, FileText, FolderKanban, GraduationCap, LayoutDashboard, Library, Menu, Users } from 'lucide-react';
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
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/employees', label: 'Employees', icon: Users, end: false },
  { to: '/admin/knowledge', label: 'Knowledge Management', icon: Library, end: false },
  { to: '/admin/documents', label: 'Company Documents', icon: FileText, end: false },
  { to: '/admin/learning', label: 'Learning Resources', icon: GraduationCap, end: false },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban, end: false },
  { to: '/admin/gaps', label: 'Knowledge Gaps', icon: CircleHelp, end: false },
];

function NavList({ onClick }) {
  return (
    <ul className="space-y-1">
      {navigation.map((item) => (
        <li key={item.to}>
          <NavigationLink to={item.to} end={item.end} icon={item.icon} onClick={onClick} className="w-full">
            {item.label}
          </NavigationLink>
        </li>
      ))}
    </ul>
  );
}

export default function AdminLayout() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const { onLogout, error, pending } = useLogoutAction();

  return (
    <div className="min-h-screen bg-canvas md:grid md:grid-cols-[16.5rem_minmax(0,1fr)]">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="hidden self-start border-r border-line bg-white md:sticky md:top-0 md:flex md:h-screen md:flex-col md:overflow-y-auto">
        <div className="px-5 py-5">
          <Logo to="/admin" />
        </div>
        <nav aria-label="Admin" className="px-3 pb-6">
          <NavList />
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-white/80 px-4 backdrop-blur">
          <Button
            variant="ghost"
            className="px-3 md:hidden"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            onClick={() => setMenuOpen(true)}
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
          <div className="md:hidden">
            <Logo to="/admin" />
          </div>
          <div className="ml-auto hidden sm:block">
            <AccountMenu pending={pending} onLogout={onLogout} />
          </div>
        </header>

        {error ? (
          <div className="mx-auto max-w-5xl px-4 pt-4 md:px-8">
            <Alert tone="error">{error}</Alert>
          </div>
        ) : null}

        <main id="main" className="mx-auto max-w-5xl px-4 py-8 md:px-8">
          <Outlet />
        </main>
      </div>

      <Modal open={menuOpen} title="Menu" onClose={closeMenu}>
        <p className="mb-3 text-sm text-muted">{user?.name}</p>
        <nav aria-label="Admin">
          <NavList onClick={closeMenu} />
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
