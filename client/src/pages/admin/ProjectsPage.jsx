import { useEffect, useState } from 'react';
import { EyeOff, Globe, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import IconButton from '../../components/ui/IconButton.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import AccessFields from '../../components/AccessFields.jsx';
import FilePicker from '../../components/ui/FilePicker.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ProjectImage from '../../components/ProjectImage.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import {
  createProject,
  deleteProject,
  listProjects,
  reprocessProject,
  updateProject,
} from '../../services/projects.js';
import { formatBytes, formatDate } from '../../utils/catalog.js';
import { getErrorMessage } from '../../utils/errors.js';

const emptyForm = {
  name: '',
  summary: '',
  siteUrl: '',
  ownerName: '',
  department: '',
  status: 'published',
  accessScope: 'all',
  team: '',
  emails: '',
};

function statusTone(status) {
  if (status === 'Published' || status === 'Indexed') return 'success';
  if (status === 'Failed') return 'warning';
  return 'neutral';
}

export default function ProjectsPage() {
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useDocumentTitle('Projects');

  async function refresh(nextQuery = query) {
    setProjects(await listProjects(nextQuery));
  }

  useEffect(() => {
    refresh('').catch((err) => setError(getErrorMessage(err, 'Could not load projects.'))).finally(() => setLoading(false));
  }, []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildFormData(values, nextImage, nextDocument) {
    const body = new FormData();
    ['name', 'summary', 'siteUrl', 'ownerName', 'department', 'status', 'accessScope', 'team', 'emails'].forEach((key) => {
      if (values[key] != null) body.append(key, values[key]);
    });
    if (nextImage) body.append('image', nextImage);
    if (nextDocument) body.append('document', nextDocument);
    return body;
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!image) {
      setError('Choose a project image.');
      return;
    }
    if (!documentFile) {
      setError('Choose a PDF, DOCX, or TXT documentation file.');
      return;
    }
    setSaving(true);
    try {
      await createProject(buildFormData(form, image, documentFile));
      setForm(emptyForm);
      setImage(null);
      setDocumentFile(null);
      event.target.reset();
      await refresh();
      setShowForm(false);
      setNotice('Project added successfully.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the project.'));
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateProject(editing.id, buildFormData(editing, editing.imageFile, editing.documentFile));
      setEditing(null);
      await refresh();
      setNotice('Project updated successfully.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update the project.'));
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action, project) {
    setError('');
    try {
      if (action === 'reprocess') await reprocessProject(project.id);
      if (action === 'publish') {
        await updateProject(project.id, {
          name: project.name,
          summary: project.summary,
          siteUrl: project.siteUrl,
          ownerName: project.ownerName,
          department: project.department,
          status: project.status === 'published' ? 'draft' : 'published',
          accessScope: project.access.scope,
          team: project.access.teams[0] || '',
          emails: (project.access.emails || []).join(', '),
        });
      }
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update the project.'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setSaving(true);
    setError('');
    try {
      await deleteProject(pendingDelete.id);
      setPendingDelete(null);
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the project.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Add a project image and a documentation file. Employees open the card to read the name, owner, site, and the text from that file."
      />
      {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}
      {notice ? <div className="mb-4"><Alert tone="success">{notice}</Alert></div> : null}

      <div className="mb-6">
        <Button type="button" onClick={() => setShowForm((current) => !current)}>
          {showForm ? 'Close form' : 'Add new project'}
        </Button>
      </div>

      {showForm ? <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
          <Input id="project-name" label="Project name" value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
          <Input id="owner-name" label="Project owner" value={form.ownerName} onChange={(event) => updateField('ownerName', event.target.value)} required />
          <Input id="site-url" label="Site URL" type="url" placeholder="https://" hint="Optional. Use a public HTTPS address." value={form.siteUrl} onChange={(event) => updateField('siteUrl', event.target.value)} />
          <Input id="department" label="Department" value={form.department} onChange={(event) => updateField('department', event.target.value)} />
          <Textarea id="summary" className="md:col-span-2" label="Short description" value={form.summary} onChange={(event) => updateField('summary', event.target.value)} />
          <Select id="project-status" label="Approval status" value={form.status} onChange={(event) => updateField('status', event.target.value)}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Select>
          <AccessFields
            scope={form.accessScope}
            team={form.team}
            emails={form.emails}
            onScope={(value) => updateField('accessScope', value)}
            onTeam={(value) => updateField('team', value)}
            onEmails={(value) => updateField('emails', value)}
          />
          <FilePicker
            id="project-image"
            label="Project image"
            required
            accept="image/png,image/jpeg,image/webp,image/gif"
            selected={image ? [image.name] : []}
            hint="PNG, JPG, WEBP, or GIF. Up to 2 MB. This image is the project card."
            onChange={(event) => setImage(event.target.files?.[0] || null)}
          />
          <FilePicker
            id="project-document"
            label="Documentation"
            required
            accept=".pdf,.docx,.txt,application/pdf,text/plain"
            selected={documentFile ? [documentFile.name] : []}
            hint="PDF, DOCX, or TXT. Up to 10 MB. The detail page shows the text from this file."
            onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
          />
          <div className="md:col-span-2">
            <Button type="submit" loading={saving} loadingLabel="Saving...">Add project</Button>
          </div>
        </form>
      </Card> : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Projects</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">Reprocess reads the documentation file again and refreshes the text employees see. Use it when a file failed to load or the text looks wrong.</p>
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            refresh().catch((err) => setError(getErrorMessage(err, 'Could not search projects.')));
          }}
        >
          <Input id="search-projects" label="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      {loading ? <p className="mt-4 text-sm text-muted" role="status">Loading projects...</p> : null}
      {!loading && projects.length === 0 ? <p className="mt-4 text-sm text-muted">No projects yet.</p> : null}
      <ul className="mt-4 space-y-3">
        {projects.map((project) => (
          <li key={project.id} className="rounded-2xl border border-line bg-card p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="w-full overflow-hidden rounded-xl sm:w-40">
                <ProjectImage project={project} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-ink">{project.name}</h3>
                    <p className="mt-1 text-sm text-muted">{project.ownerName}{project.department ? ` · ${project.department}` : ''}</p>
                    {project.summary ? <p className="mt-2 text-sm text-muted">{project.summary}</p> : null}
                    <p className="mt-2 text-sm text-muted">{project.originalName} · {formatBytes(project.size)} · {formatDate(project.createdAt)}</p>
                    {project.processingError ? <p className="mt-2 text-sm text-danger">{project.processingError}</p> : null}
                  </div>
                  <Badge tone={statusTone(project.displayStatus)}>{project.displayStatus}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <IconButton
                    icon={Pencil}
                    label="Edit"
                    onClick={() => setEditing({
                      ...project,
                      accessScope: project.access.scope,
                      team: project.access.teams[0] || '',
                      emails: (project.access.emails || []).join(', '),
                      imageFile: null,
                      documentFile: null,
                    })}
                  />
                  <IconButton
                    icon={project.status === 'published' ? EyeOff : Globe}
                    label={project.status === 'published' ? 'Unpublish' : 'Publish'}
                    onClick={() => runAction('publish', project)}
                  />
                  <IconButton
                    icon={RefreshCw}
                    label="Reprocess (read the documentation file again and refresh the stored text)"
                    onClick={() => runAction('reprocess', project)}
                  />
                  <IconButton icon={Trash2} label="Delete" variant="danger" onClick={() => setPendingDelete(project)} />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Modal open={Boolean(editing)} title="Edit project" wide onClose={() => setEditing(null)}>
        {editing ? (
          <form className="grid gap-4" onSubmit={saveEdit}>
            <Input id="edit-project-name" label="Project name" required value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
            <Input id="edit-owner-name" label="Project owner" required value={editing.ownerName} onChange={(event) => setEditing({ ...editing, ownerName: event.target.value })} />
            <Input id="edit-site-url" label="Site URL" type="url" value={editing.siteUrl || ''} onChange={(event) => setEditing({ ...editing, siteUrl: event.target.value })} />
            <Input id="edit-department" label="Department" value={editing.department || ''} onChange={(event) => setEditing({ ...editing, department: event.target.value })} />
            <Textarea id="edit-summary" label="Short description" value={editing.summary || ''} onChange={(event) => setEditing({ ...editing, summary: event.target.value })} />
            <Select id="edit-project-status" label="Approval status" value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value })}>
              <option value="published">Published</option>
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
            <div>
              <p className="text-sm font-medium text-ink">Current image</p>
              <div className="mt-2 max-w-xs overflow-hidden rounded-xl border border-line">
                <ProjectImage project={editing} />
              </div>
            </div>
            <p className="text-sm text-muted">Current documentation: {editing.originalName || 'No file name saved.'}</p>
            <FilePicker
              id="edit-project-image"
              label="Replace image"
              accept="image/png,image/jpeg,image/webp,image/gif"
              selected={editing.imageFile ? [editing.imageFile.name] : []}
              onChange={(event) => setEditing({ ...editing, imageFile: event.target.files?.[0] || null })}
            />
            <FilePicker
              id="edit-project-document"
              label="Replace documentation"
              accept=".pdf,.docx,.txt,application/pdf,text/plain"
              selected={editing.documentFile ? [editing.documentFile.name] : []}
              onChange={(event) => setEditing({ ...editing, documentFile: event.target.files?.[0] || null })}
            />
            <Button type="submit" loading={saving} loadingLabel="Saving...">Save</Button>
          </form>
        ) : null}
      </Modal>

      <Modal open={Boolean(pendingDelete)} title="Delete project" onClose={() => setPendingDelete(null)}>
        <p className="text-sm text-muted">Delete {pendingDelete?.name}? Employees will no longer see its card or documentation.</p>
        <div className="mt-4 flex gap-2">
          <Button variant="danger" loading={saving} loadingLabel="Deleting..." onClick={confirmDelete}>Delete</Button>
          <Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
