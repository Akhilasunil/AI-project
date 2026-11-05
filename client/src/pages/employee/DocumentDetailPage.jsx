import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { getVisibleDocument } from '../../services/knowledge.js';
import { downloadDocument } from '../../services/documents.js';
import { formatDate } from '../../utils/catalog.js';
import { getErrorMessage } from '../../utils/errors.js';

export default function DocumentDetailPage() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useDocumentTitle(record?.document.title || 'Document');

  useEffect(() => {
    getVisibleDocument(id)
      .then(setRecord)
      .catch((err) => setError(getErrorMessage(err, 'This document is not available.')));
  }, [id]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadDocument(record.document.id, record.document.originalName);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not download this document.'));
    } finally {
      setDownloading(false);
    }
  }

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!record) return <p className="text-sm text-muted" role="status">Loading document...</p>;

  return (
    <article className="max-w-3xl">
      <Link to="/knowledge" className="text-sm font-medium text-primary">Back to knowledge</Link>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{record.document.category}</Badge>
        <Badge tone="success">{record.document.displayStatus}</Badge>
      </div>
      <h1 className="mt-3 text-3xl font-semibold text-ink">{record.document.title}</h1>
      {record.document.description ? <p className="mt-3 text-muted">{record.document.description}</p> : null}
      <p className="mt-2 text-sm text-muted">Updated {formatDate(record.document.updatedAt)}</p>
      {String(record.document.sourceUrl || '').startsWith('https://') ? (
        <a
          href={record.document.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
        >
          Open document
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">Opens externally</span>
        </a>
      ) : (
        <>
          <div className="mt-4">
            <Button type="button" onClick={handleDownload} loading={downloading} loadingLabel="Downloading...">Download</Button>
          </div>
          <h2 className="mt-8 text-lg font-semibold text-ink">Text from this document</h2>
          <pre className="mt-3 whitespace-pre-wrap rounded-2xl border border-line bg-card p-5 text-sm text-ink">{record.text || 'No readable text was stored.'}</pre>
        </>
      )}
    </article>
  );
}
