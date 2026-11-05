import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { listKnowledgeGaps } from '../../services/knowledge.js';
import { formatDate } from '../../utils/catalog.js';
import { getErrorMessage } from '../../utils/errors.js';

export default function KnowledgeGapsPage() {
  const [gaps, setGaps] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useDocumentTitle('Knowledge Gaps');

  useEffect(() => {
    listKnowledgeGaps()
      .then(setGaps)
      .catch((err) => setError(getErrorMessage(err, 'Could not load knowledge gaps.')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Knowledge Gaps"
        description="Questions that approved company sources could not answer."
      />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {loading ? <p className="text-sm text-muted" role="status">Loading knowledge gaps...</p> : null}
      {!loading && gaps.length === 0 ? <p className="text-sm text-muted">No knowledge gaps yet.</p> : null}
      <ul className="space-y-3">
        {gaps.map((gap) => (
          <li key={gap.id} className="rounded-2xl border border-line bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-semibold text-ink">{gap.question}</h2>
              <Badge tone={gap.status === 'open' ? 'warning' : 'success'}>{gap.status === 'open' ? 'Information not found' : 'Resolved'}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted">Asked {gap.askCount} {gap.askCount === 1 ? 'time' : 'times'} · Last asked {formatDate(gap.lastAskedAt)}</p>
            {gap.status === 'open' ? (
              <div className="mt-3 flex flex-wrap gap-4">
                <Link to="/admin/documents" className="text-sm font-medium text-primary">Add a document</Link>
                <Link to="/admin/learning" className="text-sm font-medium text-primary">Add a learning resource</Link>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
