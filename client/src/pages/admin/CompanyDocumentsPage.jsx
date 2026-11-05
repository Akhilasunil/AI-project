import { useEffect, useState } from 'react';
import { Download, EyeOff, Globe, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import IconButton from '../../components/ui/IconButton.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import FilePicker from '../../components/ui/FilePicker.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import AccessFields from '../../components/AccessFields.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import {
  deleteDocument,
  downloadDocument,
  listDocuments,
  reprocessDocument,
  updateDocument,
  uploadDocuments,
} from '../../services/documents.js';
import { DOCUMENT_CATEGORIES, formatBytes, formatDate } from '../../utils/catalog.js';
import { getErrorMessage } from '../../utils/errors.js';

const emptyForm = {
  title: '',
  description: '',
  category: 'Leave',
  department: 'HR',
  approvalStatus: 'published',
  library: 'company',
  accessScope: 'all',
  team: '',
  emails: '',
};

function statusTone(status) {
  if (status === 'Published' || status === 'Indexed') return 'success';
  if (status === 'Failed') return 'warning';
  if (status === 'Pending Review') return 'warning';
  return 'neutral';
}

export default function CompanyDocumentsPage() {
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useDocumentTitle('Company Documents');

  async function refresh(nextQuery = query) {
    setDocuments(await listDocuments(nextQuery));
  }

  useEffect(() => {
    refresh('').catch((err) => setError(getErrorMessage(err, 'Could not load documents.'))).finally(() => setLoading(false));
  }, []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleUpload(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!files.length) {
      setError('Choose a PDF, DOCX, or TXT file.');
      return;
    }
    const body = new FormData();
    files.forEach((file) => body.append('files', file));
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    setSaving(true);
    try {
      await uploadDocuments(body);
      setForm(emptyForm);
      setFiles([]);
      event.target.reset();
      await refresh();
      setShowForm(false);
      setNotice('Document added successfully.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not upload the document.'));
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateDocument(editing.id, editing);
      setEditing(null);
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update the document.'));
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action, document) {
    setError('');
    try {
      if (action === 'reprocess') await reprocessDocument(document.id);
      if (action === 'publish') {
        await updateDocument(document.id, {
          ...document,
          approvalStatus: document.approvalStatus === 'published' ? 'draft' : 'published',
          accessScope: document.access.scope,
          team: document.access.teams[0] || '',
          emails: document.access.emails.join(', '),
        });
      }
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update the document.'));
    }
  }

  async function confirmDelete() {
    setSaving(true);
    setError('');
    try {
      await deleteDocument(pendingDelete.id);
      setPendingDelete(null);
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the document.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Company Documents"
        description="Upload leave, WFH, holiday, and other approved files. Employees can ask about a document after it is published and indexed."
      />
      {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}
      {notice ? <div className="mb-4"><Alert tone="success">{notice}</Alert></div> : null}

      <div className="mb-6">
        <Button type="button" onClick={() => setShowForm((current) => !current)}>
          {showForm ? 'Close form' : 'Add new document/policies'}
        </Button>
      </div>

      {showForm ? <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUpload}>
          <div className="md:col-span-2">
            <FilePicker
              id="files"
              label="Files"
              required
              multiple
              selected={files.map((file) => file.name)}
              accept=".pdf,.docx,.txt,application/pdf,text/plain"
              hint="PDF, DOCX, or TXT. Up to 10 files, 10 MB each. A title is applied when you upload one file."
              onChange={(event) => setFiles([...event.target.files])}
            />
          </div>
          <Input id="title" label="Title" value={form.title} onChange={(event) => updateField('title', event.target.value)} />
          <Select id="category" label="Category" required value={form.category} onChange={(event) => updateField('category', event.target.value)}>
            {DOCUMENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </Select>
          <Textarea id="description" className="md:col-span-2" label="Description" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
          <Input id="department" label="Department" value={form.department} onChange={(event) => updateField('department', event.target.value)} />
          <Select id="approvalStatus" label="Approval status" value={form.approvalStatus} onChange={(event) => updateField('approvalStatus', event.target.value)}>
            <option value="published">Published</option>
            <option value="pending_review">Pending review</option>
            <option value="draft">Draft</option>
          </Select>
          <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
            <AccessFields
              scope={form.accessScope}
              team={form.team}
              emails={form.emails}
              onScope={(value) => updateField('accessScope', value)}
              onTeam={(value) => updateField('team', value)}
              onEmails={(value) => updateField('emails', value)}
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" loading={saving} loadingLabel="Uploading...">Upload</Button>
          </div>
        </form>
      </Card> : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-lg font-semibold text-ink">Uploaded documents</h2>
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            refresh().catch((err) => setError(getErrorMessage(err, 'Could not search documents.')));
          }}
        >
          <Input id="search-documents" label="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      {loading ? <p className="mt-4 text-sm text-muted" role="status">Loading documents...</p> : null}
      {!loading && documents.length === 0 ? <p className="mt-4 text-sm text-muted">No documents uploaded.</p> : null}
      <ul className="mt-4 space-y-3">
        {documents.map((document) => (
          <li key={document.id} className="rounded-2xl border border-line bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-ink">{document.title}</h3>
                {document.description ? <p className="mt-1 text-sm text-muted">{document.description}</p> : null}
                <p className="mt-2 text-sm text-muted">
                  {document.category} · {document.originalName} · {formatBytes(document.size)} · {formatDate(document.createdAt)}
                </p>
                {document.processingError ? <p className="mt-2 text-sm text-danger">{document.processingError}</p> : null}
              </div>
              <Badge tone={statusTone(document.displayStatus)}>{document.displayStatus}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <IconButton icon={Download} label="Download" onClick={() => downloadDocument(document.id, document.originalName)} />
              <IconButton
                icon={Pencil}
                label="Edit"
                onClick={() => setEditing({
                  ...document,
                  accessScope: document.access.scope,
                  team: document.access.teams[0] || '',
                  emails: document.access.emails.join(', '),
                })}
              />
              <IconButton
                icon={document.approvalStatus === 'published' ? EyeOff : Globe}
                label={document.approvalStatus === 'published' ? 'Unpublish' : 'Publish'}
                onClick={() => runAction('publish', document)}
              />
              <IconButton icon={RefreshCw} label="Reprocess" onClick={() => runAction('reprocess', document)} />
              <IconButton icon={Trash2} label="Delete" variant="danger" onClick={() => setPendingDelete(document)} />
            </div>
          </li>
        ))}
      </ul>

      <Modal open={Boolean(editing)} title="Edit document" wide onClose={() => setEditing(null)}>
        {editing ? (
          <form className="grid gap-4" onSubmit={saveEdit}>
            <Input id="edit-title" label="Title" required value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} />
            <Textarea id="edit-description" label="Description" value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} />
            <Select id="edit-category" label="Category" required value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })}>
              {DOCUMENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </Select>
            <Input id="edit-department" label="Department" value={editing.department} onChange={(event) => setEditing({ ...editing, department: event.target.value })} />
            <Select id="edit-approval" label="Approval status" value={editing.approvalStatus} onChange={(event) => setEditing({ ...editing, approvalStatus: event.target.value })}>
              <option value="published">Published</option>
              <option value="pending_review">Pending review</option>
              <option value="draft">Draft</option>
            </Select>
            <AccessFields
              idPrefix="edit-"
              scope={editing.accessScope}
              team={editing.team}
              emails={editing.emails}
              onScope={(value) => setEditing({ ...editing, accessScope: value })}
              onTeam={(value) => setEditing({ ...editing, team: value })}
              onEmails={(value) => setEditing({ ...editing, emails: value })}
            />
            <Button type="submit" loading={saving} loadingLabel="Saving...">Save</Button>
          </form>
        ) : null}
      </Modal>

      <Modal open={Boolean(pendingDelete)} title="Delete document" onClose={() => setPendingDelete(null)}>
        <p className="text-sm text-muted">Delete {pendingDelete?.title}? Employees will no longer be able to ask about it.</p>
        <div className="mt-4 flex gap-2">
          <Button variant="danger" loading={saving} loadingLabel="Deleting..." onClick={confirmDelete}>Delete</Button>
          <Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
