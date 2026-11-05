import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Logo from '../../components/Logo.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.js';

const points = [
  'Policies, projects, and company processes',
  'Learning resources your role can open',
  'Access limited to your account',
];

function validateForm(values) {
  const nextErrors = {};
  const email = values.email.trim();

  if (!email) nextErrors.email = 'Enter your work email.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid work email.';

  if (!values.password) nextErrors.password = 'Enter your password.';
  else if (values.password.length > 128) nextErrors.password = 'Password must be 128 characters or fewer.';

  return nextErrors;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useDocumentTitle('Sign in');

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateForm({ email, password });
    setErrors(nextErrors);
    setFormError('');

    if (Object.keys(nextErrors).length > 0) {
      document.getElementById(nextErrors.email ? 'email' : 'password')?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      navigate(user.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        document.getElementById(fieldErrors.email ? 'email' : 'password')?.focus();
      } else {
        setFormError(getErrorMessage(error, 'Could not sign in. Try again.'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <a href="#signin" className="skip-link">
        Skip to sign in
      </a>
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-700 via-primary to-sky-600 px-12 py-10 text-white lg:flex">
        <div aria-hidden="true" className="blob-drift pointer-events-none absolute -right-16 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden="true" className="blob-drift pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" style={{ animationDelay: '-5s' }} />
        <div aria-hidden="true" className="orbit pointer-events-none absolute right-12 top-24 h-40 w-40 rounded-full border border-dashed border-white/30" />
        <div className="relative"><Logo inverse /></div>
        <div className="relative max-w-md">
          <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-sm">Internal knowledge assistant</p>
          <p className="mt-6 text-4xl font-semibold leading-tight">
            Find trusted answers from approved company knowledge.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {points.map((point) => (
              <li key={point} className="flex gap-3">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm">Internal use only</p>
      </aside>

      <main className="flex items-center justify-center bg-canvas px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 id="signin" className="text-3xl font-semibold tracking-tight text-ink">
            Sign in
          </h1>
          <p className="mt-2 text-muted">Use your company account to continue.</p>
          <Card className="mt-8">
            <form onSubmit={handleSubmit} noValidate>
              {formError ? (
                <div className="mb-5">
                  <Alert tone="error">{formError}</Alert>
                </div>
              ) : null}
              <div className="space-y-5">
                <Input
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrors((current) => ({ ...current, email: undefined }));
                  }}
                  error={errors.email}
                  required
                  disabled={submitting}
                />
                <Input
                  id="password"
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrors((current) => ({ ...current, password: undefined }));
                  }}
                  error={errors.password}
                  required
                  disabled={submitting}
                  trailing={
                    <button
                      type="button"
                      className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted hover:text-ink"
                      aria-pressed={showPassword}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      disabled={submitting}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? (
                        <EyeOff aria-hidden="true" className="h-4 w-4" />
                      ) : (
                        <Eye aria-hidden="true" className="h-4 w-4" />
                      )}
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  }
                />
              </div>
              <Button type="submit" className="mt-6 w-full" loading={submitting} loadingLabel="Signing in...">
                Sign in
              </Button>
            </form>
          </Card>
          <p className="mt-6 text-sm text-muted lg:hidden">Internal use only</p>
        </div>
      </main>
    </div>
  );
}
