import { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
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
import LearningDocumentsPanel from '../../components/LearningDocumentsPanel.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ResourceCard from '../../components/ResourceCard.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import {
  deleteLearningResource,
  listLearningResources,
  saveLearningResource,
} from '../../services/learningResources.js';
import { deleteDocument, listDocuments, updateDocument } from '../../services/documents.js';
import { LEARNING_DOCUMENT_CATEGORIES, RESOURCE_CATEGORIES, RESOURCE_TYPES } from '../../utils/catalog.js';
import { getErrorMessage } from '../../utils/errors.js';

const emptyForm = {
  title: '',
  description: '',
  resourceType: 'Video',
  category: 'Other',
  resourceUrl: '',
  thumbnailUrl: '',
  targetAudience: '',
  trainer: '',
  duration: '',
  status: 'published',
  accessScope: 'all',
  team: '',
  emails: '',
};

const RESOURCE_FIELDS = [
  'title',
  'description',
  'resourceType',
  'category',
  'resourceUrl',
  'thumbnailUrl',
  'targetAudience',
  'trainer',
  'duration',
  'status',
  'accessScope',
  'team',
  'emails',
];

function toPayload(form, file) {
  const body = new FormData();
  RESOURCE_FIELDS.forEach((key) => {
    if (form[key] != null) body.append(key, form[key]);
  });
  if (file) body.append('thumbnail', file);
  return body;
}

export default function LearningResourcesPage() {
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [resources, setResources] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showVideos, setShowVideos] = useState(false);

  useDocumentTitle('Learning Resources');

  async function refresh() {
    const [nextResources, nextDocuments] = await Promise.all([
      listLearningResources({}),
      listDocuments('', 'learning'),
    ]);
    setResources(nextResources);
    setDocuments(nextDocuments);
  }

  useEffect(() => {
    refresh().catch((err) => setError(getErrorMessage(err, 'Could not load learning resources.'))).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const preview = useMemo(() => ({
    id: 'preview',
    title: form.title || 'Resource title',
    description: form.description,
    resourceType: form.resourceType,
    category: form.category,
    resourceUrl: form.resourceUrl,
    thumbnailUrl: previewUrl || form.thumbnailUrl,
    hasThumbnail: Boolean(previewUrl || form.thumbnailUrl),
  }), [form, previewUrl]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      await saveLearningResource(toPayload({ ...form, resourceType: 'Video' }, imageFile));
      setForm(emptyForm);
      setImageFile(null);
      event.target.reset();
      setShowVideos(false);
      await refresh();
      setNotice('Learning video added successfully.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the learning resource.'));
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await saveLearningResource(toPayload(editing, editing.imageFile), editing.id);
      setEditing(null);
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update the learning resource.'));
    } finally {
      setSaving(false);
    }
  }

  async function saveDocumentEdit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateDocument(editingDocument.id, { ...editingDocument, library: 'learning' });
      setEditingDocument(null);
      await refresh();
      setNotice('Learning document updated successfully.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update the learning document.'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setSaving(true);
    setError('');
    const kind = pendingDelete.kind;
    try {
      if (kind === 'document') await deleteDocument(pendingDelete.item.id);
      else await deleteLearningResource(pendingDelete.item.id);
      setPendingDelete(null);
      await refresh();
      setNotice(kind === 'document' ? 'Learning document deleted.' : 'Learning video deleted.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete this item.'));
    } finally {
      setSaving(false);
    }
  }

  const needle = query.trim().toLowerCase();
  const rows = [
    ...documents.map((document) => ({
      key: `document-${document.id}`,
      title: document.title,
      type: 'Document',
      category: document.category,
      status: document.displayStatus,
      onEdit: () => setEditingDocument({
        ...document,
        library: 'learning',
        accessScope: document.access.scope,
        team: document.access.teams[0] || '',
        emails: (document.access.emails || []).join(', '),
      }),
      onDelete: () => setPendingDelete({ kind: 'document', item: document }),
    })),
    ...resources.map((resource) => ({
      key: `resource-${resource.id}`,
      title: resource.title,
      type: resource.resourceType === 'Video' ? 'Video' : resource.resourceType,
      category: resource.category,
      status: resource.status === 'published' ? 'Published' : 'Draft',
      onEdit: () => setEditing({
        ...resource,
        accessScope: resource.access.scope,
        team: resource.access.teams[0] || '',
        emails: (resource.access.emails || []).join(', '),
        imageFile: null,
      }),
      onDelete: () => setPendingDelete({ kind: 'video', item: resource }),
    })),
  ].filter((row) => !needle || `${row.title} ${row.type} ${row.category}`.toLowerCase().includes(needle));

  return (
    <div>
      <PageHeader
        title="Learning Resources"
        description="Upload learning documents, or add a video or course link with a thumbnail. The video file stays at the original link."
      />
      {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}
      {notice ? <div className="mb-4"><Alert tone="success">{notice}</Alert></div> : null}

      <div className="mb-6 flex flex-wrap gap-2">
        <Button type="button" onClick={() => { setShowDocuments((current) => !current); setShowVideos(false); }}>
          {showDocuments ? 'Close form' : 'Add Learning Documents'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => { setShowVideos((current) => !current); setShowDocuments(false); }}>
          {showVideos ? 'Close form' : 'Add Learning Videos'}
        </Button>
      </div>

      <LearningDocumentsPanel
        open={showDocuments}
        onSaved={() => {
          setShowDocuments(false);
          setNotice('Learning document added successfully.');
          refresh().catch((err) => setError(getErrorMessage(err, 'Could not refresh learning items.')));
        }}
      />

      {showVideos ? <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <Input id="resource-title" label="Title" value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
            <Textarea id="resource-description" className="md:col-span-2" label="Short description" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
            <Select id="resource-category" label="Category" required value={form.category} onChange={(event) => updateField('category', event.target.value)}>
              {RESOURCE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </Select>
            <Select id="resource-status" label="Approval status" value={form.status} onChange={(event) => updateField('status', event.target.value)}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </Select>
            <Input id="resource-url" className="md:col-span-2" label={form.resourceType === 'Video' ? 'Video URL' : 'Resource URL'} type="url" value={form.resourceUrl} placeholder="https://" onChange={(event) => updateField('resourceUrl', event.target.value)} required />
            <Input id="thumbnail-url" label="Thumbnail image URL" type="url" hint="Optional. Use HTTPS, or upload an image instead." value={form.thumbnailUrl} placeholder="https://" onChange={(event) => updateField('thumbnailUrl', event.target.value)} />
            <FilePicker
              id="thumbnail-file"
              label="Thumbnail image"
              accept="image/png,image/jpeg,image/webp,image/gif"
              selected={imageFile ? [imageFile.name] : []}
              hint="Optional. PNG, JPG, WEBP, or GIF."
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            />
            {form.resourceType === 'Video' ? (
              <>
                <Input id="trainer" label="Trainer or presenter" value={form.trainer} onChange={(event) => updateField('trainer', event.target.value)} />
                <Input id="duration" label="Duration" value={form.duration} placeholder="12 min" onChange={(event) => updateField('duration', event.target.value)} />
              </>
            ) : null}
            <Input id="audience" label="Target audience" value={form.targetAudience} onChange={(event) => updateField('targetAudience', event.target.value)} />
            <AccessFields
              scope={form.accessScope}
              team={form.team}
              emails={form.emails}
              onScope={(value) => updateField('accessScope', value)}
              onTeam={(value) => updateField('team', value)}
              onEmails={(value) => updateField('emails', value)}
            />
            <div className="md:col-span-2">
              <Button type="submit" loading={saving} loadingLabel="Saving...">Add video</Button>
            </div>
          </form>
        </Card>
        <div>
          <h2 className="mb-3 text-sm font-medium text-ink">Card preview</h2>
          <ResourceCard resource={preview} />
        </div>
      </div> : null}

      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-lg font-semibold text-ink">Learning library</h2>
        <Input id="resource-search" label="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      {loading ? <p className="mt-4 text-sm text-muted" role="status">Loading learning items...</p> : null}
      {!loading && rows.length === 0 ? <p className="mt-4 text-sm text-muted">No learning documents or videos yet.</p> : null}
      {!loading && rows.length > 0 ? (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-slate-50 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{row.title}</td>
                  <td className="px-4 py-3"><Badge tone={row.type === 'Video' ? 'primary' : 'accent'}>{row.type}</Badge></td>
                  <td className="px-4 py-3 text-muted">{row.category}</td>
                  <td className="px-4 py-3 text-muted">{row.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <IconButton icon={Pencil} label="Edit" onClick={row.onEdit} />
                      <IconButton icon={Trash2} label="Delete" variant="danger" onClick={row.onDelete} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal open={Boolean(editing)} title="Edit learning resource" wide onClose={() => setEditing(null)}>
        {editing ? (
          <form className="grid gap-4" onSubmit={saveEdit}>
            <Input id="edit-resource-title" label="Title" required value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} />
            <Textarea id="edit-resource-description" label="Description" value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} />
            <Select id="edit-resource-type" label="Resource type" value={editing.resourceType} onChange={(event) => setEditing({ ...editing, resourceType: event.target.value })}>
              {RESOURCE_TYPES.map((type) => <option key={type}>{type}</option>)}
            </Select>
            <Select id="edit-resource-category" label="Category" value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })}>
              {RESOURCE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </Select>
            <Select id="edit-resource-status" label="Approval status" value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value })}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </Select>
            <Input id="edit-resource-url" label="Resource URL" type="url" required value={editing.resourceUrl} onChange={(event) => setEditing({ ...editing, resourceUrl: event.target.value })} />
            <Input id="edit-thumbnail-url" label="Thumbnail image URL" type="url" value={editing.thumbnailUrl || ''} onChange={(event) => setEditing({ ...editing, thumbnailUrl: event.target.value })} />
            <FilePicker
              id="edit-thumbnail-file"
              label="Replace thumbnail image"
              accept="image/png,image/jpeg,image/webp,image/gif"
              selected={editing.imageFile ? [editing.imageFile.name] : []}
              onChange={(event) => setEditing({ ...editing, imageFile: event.target.files?.[0] || null })}
            />
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

      <Modal open={Boolean(editingDocument)} title="Edit learning document" wide onClose={() => setEditingDocument(null)}>
        {editingDocument ? (
          <form className="grid gap-4" onSubmit={saveDocumentEdit}>
            <Input id="edit-learning-title" label="Title" required value={editingDocument.title} onChange={(event) => setEditingDocument({ ...editingDocument, title: event.target.value })} />
            <Textarea id="edit-learning-description" label="Description" value={editingDocument.description || ''} onChange={(event) => setEditingDocument({ ...editingDocument, description: event.target.value })} />
            <Select id="edit-learning-category" label="Category" required value={editingDocument.category} onChange={(event) => setEditingDocument({ ...editingDocument, category: event.target.value })}>
              {LEARNING_DOCUMENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </Select>
            {editingDocument.sourceUrl ? (
              <Input
                id="edit-learning-link"
                label="Document link"
                type="url"
                required
                value={editingDocument.sourceUrl}
                onChange={(event) => setEditingDocument({ ...editingDocument, sourceUrl: event.target.value })}
              />
            ) : null}
            <Select id="edit-learning-status" label="Approval status" value={editingDocument.approvalStatus} onChange={(event) => setEditingDocument({ ...editingDocument, approvalStatus: event.target.value })}>
              <option value="published">Published</option>
              <option value="pending_review">Pending review</option>
              <option value="draft">Draft</option>
            </Select>
            <AccessFields
              idPrefix="edit-learning-"
              scope={editingDocument.accessScope}
              team={editingDocument.team}
              emails={editingDocument.emails}
              onScope={(value) => setEditingDocument({ ...editingDocument, accessScope: value })}
              onTeam={(value) => setEditingDocument({ ...editingDocument, team: value })}
              onEmails={(value) => setEditingDocument({ ...editingDocument, emails: value })}
            />
            <Button type="submit" loading={saving} loadingLabel="Saving...">Save</Button>
          </form>
        ) : null}
      </Modal>

      <Modal open={Boolean(pendingDelete)} title="Delete learning item" onClose={() => setPendingDelete(null)}>
        <p className="text-sm text-muted">Delete {pendingDelete?.item?.title}?</p>
        <div className="mt-4 flex gap-2">
          <Button variant="danger" loading={saving} loadingLabel="Deleting..." onClick={confirmDelete}>Delete</Button>
          <Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
