import { Navigate } from 'react-router-dom';
import FullPageSpinner from '../components/FullPageSpinner.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

export default function ResolveUnknown() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
}
