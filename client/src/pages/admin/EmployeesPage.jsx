import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import IconButton from '../../components/ui/IconButton.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Select from '../../components/ui/Select.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { createUser, deleteUser, listUsers, updateUser } from '../../services/users.js';
import { formatDate } from '../../utils/catalog.js';
import { getErrorMessage } from '../../utils/errors.js';
import { formatRole } from '../../utils/format.js';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  team: '',
};

export default function EmployeesPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useDocumentTitle('Employees');

  async function refresh() {
    setAccounts(await listUsers());
  }

  useEffect(() => {
    refresh()
      .catch((err) => setError(getErrorMessage(err, 'Could not load accounts.')))
      .finally(() => setLoading(false));
  }, []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      await createUser(form);
      setForm(emptyForm);
      event.target.reset();
      await refresh();
      setShowForm(false);
      setNotice('Employee added successfully.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not add the account.'));
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateUser(editing.id, {
        role: editing.role,
        team: editing.team,
        isActive: editing.isActive,
      });
      setEditing(null);
      await refresh();
      setNotice('Account updated. Access follows the saved role.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update the account.'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setSaving(true);
    setError('');
    try {
      await deleteUser(pendingDelete.id);
      setPendingDelete(null);
      await refresh();
      setNotice('Employee deleted.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the account.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Add an account and assign admin or employee access. Only that role decides what they can open."
      />
      {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}
      {notice ? <div className="mb-4"><Alert tone="success">{notice}</Alert></div> : null}

      <div className="mb-6">
        <Button type="button" onClick={() => setShowForm((current) => !current)}>
          {showForm ? 'Close form' : 'Add new employee'}
        </Button>
      </div>

      {showForm ? <Card className="mb-8">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
          <Input id="account-name" label="Name" required value={form.name} onChange={(event) => updateField('name', event.target.value)} />
          <Input id="account-email" label="Email" type="email" required autoComplete="off" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
          <Input
            id="account-password"
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            hint="At least 8 characters."
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
          />
          <Select id="account-role" label="Role" required value={form.role} onChange={(event) => updateField('role', event.target.value)}>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </Select>
          <Input id="account-team" label="Team" hint="Optional. Used when a document is limited to one team." value={form.team} onChange={(event) => updateField('team', event.target.value)} />
          <div className="md:col-span-2">
            <Button type="submit" loading={saving} loadingLabel="Adding...">Add account</Button>
          </div>
        </form>
      </Card> : null}

      <h2 className="text-lg font-semibold text-ink">Registered accounts</h2>
      {loading ? <p className="mt-4 text-sm text-muted" role="status">Loading accounts...</p> : null}
      {!loading && accounts.length === 0 ? <p className="mt-4 text-sm text-muted">No accounts yet.</p> : null}
      {!loading && accounts.length > 0 ? (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-slate-50 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => {
                const isSelf = account.id === user?.id;
                return (
                  <tr key={account.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{account.name}{isSelf ? ' (you)' : ''}</td>
                    <td className="px-4 py-3 text-muted">{account.email}</td>
                    <td className="px-4 py-3"><Badge tone={account.role === 'admin' ? 'primary' : 'accent'}>{formatRole(account.role)}</Badge></td>
                    <td className="px-4 py-3 text-muted">{account.team || '—'}</td>
                    <td className="px-4 py-3"><Badge tone={account.isActive ? 'success' : 'warning'}>{account.isActive ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="px-4 py-3 text-muted">{formatDate(account.createdAt)}</td>
                    <td className="px-4 py-3">
                      {isSelf ? <span className="text-muted">Your account</span> : (
                        <div className="flex flex-wrap gap-2">
                          <IconButton
                            icon={Pencil}
                            label="Edit"
                            onClick={() => setEditing({
                              id: account.id,
                              name: account.name,
                              role: account.role,
                              team: account.team || '',
                              isActive: account.isActive,
                            })}
                          />
                          <IconButton icon={Trash2} label="Delete" variant="danger" onClick={() => setPendingDelete(account)} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal open={Boolean(editing)} title="Edit access" onClose={() => setEditing(null)}>
        {editing ? (
          <form className="grid gap-4" onSubmit={saveEdit}>
            <p className="text-sm text-muted">{editing.name} can open only the pages allowed for the role you save.</p>
            <Select id="edit-role" label="Role" required value={editing.role} onChange={(event) => setEditing({ ...editing, role: event.target.value })}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </Select>
            <Input id="edit-team" label="Team" value={editing.team} onChange={(event) => setEditing({ ...editing, team: event.target.value })} />
            <Select id="edit-status" label="Account status" required value={editing.isActive ? 'active' : 'inactive'} onChange={(event) => setEditing({ ...editing, isActive: event.target.value === 'active' })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
            <Button type="submit" loading={saving} loadingLabel="Saving...">Save access</Button>
          </form>
        ) : null}
      </Modal>

      <Modal open={Boolean(pendingDelete)} title="Delete account" onClose={() => setPendingDelete(null)}>
        <p className="text-sm text-muted">Delete {pendingDelete?.name}? They will no longer be able to sign in.</p>
        <div className="mt-4 flex gap-2">
          <Button variant="danger" loading={saving} loadingLabel="Deleting..." onClick={confirmDelete}>Delete</Button>
          <Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
