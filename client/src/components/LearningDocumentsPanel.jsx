import { useState } from 'react';
import Alert from './ui/Alert.jsx';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import FilePicker from './ui/FilePicker.jsx';
import Input from './ui/Input.jsx';
import Select from './ui/Select.jsx';
import Textarea from './ui/Textarea.jsx';
import AccessFields from './AccessFields.jsx';
import { uploadDocuments } from '../services/documents.js';
import { LEARNING_DOCUMENT_CATEGORIES } from '../utils/catalog.js';
import { getErrorMessage } from '../utils/errors.js';

const emptyForm = {
  title: '',
  description: '',
  category: 'AI',
  department: '',
  approvalStatus: 'published',
  library: 'learning',
  accessScope: 'all',
  team: '',
  emails: '',
};

export default function LearningDocumentsPanel({ open, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [source, setSource] = useState('upload');
  const [sourceUrl, setSourceUrl] = useState('');
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleUpload(event) {
    event.preventDefault();
    setError('');
    if (source === 'upload' && !files.length) {
      setError('Choose a PDF, DOCX, or TXT file.');
      return;
    }
    if (source === 'link' && !sourceUrl.trim()) {
      setError('Enter an HTTPS document link.');
      return;
    }
    const body = new FormData();
    if (source === 'upload') files.forEach((file) => body.append('files', file));
    else body.append('sourceUrl', sourceUrl.trim());
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    setSaving(true);
    try {
      await uploadDocuments(body);
      setForm(emptyForm);
      setSource('upload');
      setSourceUrl('');
      setFiles([]);
      event.target.reset();
      onSaved?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not upload the learning document.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mb-6">
      {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUpload}>
        <Select
          id="learning-doc-source"
          className="md:col-span-2"
          label="How to add this document"
          value={source}
          onChange={(event) => {
            setSource(event.target.value);
            setError('');
          }}
        >
          <option value="upload">Upload a file</option>
          <option value="link">Add a document link</option>
        </Select>
        {source === 'link' ? (
          <Input
            id="learning-doc-link"
            className="md:col-span-2"
            label="Document link"
            type="url"
            required
            value={sourceUrl}
            placeholder="https://"
            hint="Use an HTTPS link, such as a Google Drive link. Employees open it in a new tab."
            onChange={(event) => setSourceUrl(event.target.value)}
          />
        ) : (
          <div className="md:col-span-2">
            <FilePicker
              id="learning-files"
              label="Files"
              required
              multiple
              selected={files.map((file) => file.name)}
              accept=".pdf,.docx,.txt,application/pdf,text/plain"
              hint="PDF, DOCX, or TXT. Up to 10 files, 10 MB each."
              onChange={(event) => setFiles([...event.target.files])}
            />
          </div>
        )}
        <Input id="learning-doc-title" label="Title" required value={form.title} onChange={(event) => updateField('title', event.target.value)} />
        <Select id="learning-doc-category" label="Category" required value={form.category} onChange={(event) => updateField('category', event.target.value)}>
          {LEARNING_DOCUMENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </Select>
        <Textarea id="learning-doc-description" className="md:col-span-2" label="Description" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
        <Select id="learning-doc-status" label="Approval status" value={form.approvalStatus} onChange={(event) => updateField('approvalStatus', event.target.value)}>
          <option value="published">Published</option>
          <option value="pending_review">Pending review</option>
          <option value="draft">Draft</option>
        </Select>
        <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
          <AccessFields
            idPrefix="learning-doc-"
            scope={form.accessScope}
            team={form.team}
            emails={form.emails}
            onScope={(value) => updateField('accessScope', value)}
            onTeam={(value) => updateField('team', value)}
            onEmails={(value) => updateField('emails', value)}
          />
        </div>
        <div className="md:col-span-2">
          {source === 'upload' ? (
            <Button type="submit" loading={saving} loadingLabel="Uploading...">Upload document</Button>
          ) : (
            <Button type="submit" loading={saving} loadingLabel="Saving...">Add document link</Button>
          )}
        </div>
      </form>
    </Card>
  );
}
