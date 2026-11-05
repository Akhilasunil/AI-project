import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useLogoutAction } from '../../hooks/useLogoutAction.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { displayValue, formatRole } from '../../utils/format.js';

export default function ProfilePage() {
  const { user } = useAuth();
  const { onLogout, error, pending } = useLogoutAction();
  const skills = Array.isArray(user?.skills) ? user.skills : [];

  useDocumentTitle('Profile');

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Profile"
        description="Your account details. Passwords and session tokens are not shown here."
      />
      {error ? (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}
      <Card>
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">Name</dt>
            <dd className="mt-1 font-medium text-ink">{displayValue(user?.name)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Email</dt>
            <dd className="mt-1 font-medium text-ink break-all">{displayValue(user?.email)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Role</dt>
            <dd className="mt-2">
              <Badge tone="primary">{formatRole(user?.role)}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Team</dt>
            <dd className="mt-1 font-medium text-ink">{displayValue(user?.team)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted">Skills</dt>
            <dd className="mt-2">
              {skills.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <li key={skill}>
                      <Badge>{skill}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-medium text-ink">Not provided</p>
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted">Projects</dt>
            <dd className="mt-1 text-ink">No projects assigned.</dd>
          </div>
        </dl>
      </Card>
      <section className="mt-8" aria-labelledby="account-settings">
        <h2 id="account-settings" className="text-lg font-semibold text-ink">
          Account
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted">Signing out ends this session.</p>
        <div className="mt-4">
          <Button type="button" variant="secondary" onClick={onLogout} loading={pending} loadingLabel="Signing out...">
            Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}
