import { useState } from 'react';
import { getErrorMessage } from '../utils/errors.js';
import { useAuth } from './useAuth.jsx';

export function useLogoutAction() {
  const { logout } = useAuth();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    setError('');
    try {
      await logout();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not sign out. Try again.'));
      setPending(false);
    }
  }

  return { onLogout, error, pending };
}
