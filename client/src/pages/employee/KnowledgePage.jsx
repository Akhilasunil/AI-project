import { useEffect, useState } from 'react';
import { ExternalLink, FileText, GraduationCap, Video } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ResourceCard from '../../components/ResourceCard.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { listVisibleDocuments } from '../../services/knowledge.js';
import { listVisibleResources } from '../../services/learningResources.js';
import { formatDate } from '../../utils/catalog.js';
import { getErrorMessage } from '../../utils/errors.js';

export default function KnowledgePage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [companyDocuments, setCompanyDocuments] = useState([]);
  const [learningDocuments, setLearningDocuments] = useState([]);
  const [resources, setResources] = useState([]);
  const [videoOnly, setVideoOnly] = useState(params.get('section') === 'videos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle('Knowledge');

  async function load(nextQuery = query, videos = videoOnly) {
    setLoading(true);
    setError('');
    try {
      const [nextCompany, nextLearning, nextResources] = await Promise.all([
        listVisibleDocuments(nextQuery, 'company'),
        listVisibleDocuments(nextQuery, 'learning'),
        listVisibleResources({ q: nextQuery, resourceType: videos ? 'Video' : undefined }),
      ]);
      setCompanyDocuments(nextCompany);
      setLearningDocuments(nextLearning);
      setResources(nextResources);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load company knowledge.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(query, videoOnly);
  }, []);

  useEffect(() => {
    const id = window.location.hash.replace('#', '');
    if (!id || loading) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading]);

  const visibleResources = videoOnly ? resources.filter((resource) => resource.resourceType === 'Video') : resources;

  return (
    <div>
      <PageHeader title="Knowledge" description="Company documents, learning documents, and learning videos you are allowed to open." />
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const next = new URLSearchParams(params);
          if (query) next.set('q', query);
          else next.delete('q');
          setParams(next);
          load();
        }}
      >
        <Input id="knowledge-search" className="sm:min-w-80" label="Search" placeholder="Search company knowledge..." value={query} onChange={(event) => setQuery(event.target.value)} />
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant="secondary"
          aria-pressed={videoOnly}
          onClick={() => {
            const next = !videoOnly;
            setVideoOnly(next);
            load(query, next);
          }}
        >
          {videoOnly ? 'Showing videos' : 'Videos'}
        </Button>
      </form>
      {error ? <div className="mt-4"><Alert tone="error">{error}</Alert></div> : null}
      {loading ? <p className="mt-6 text-sm text-muted" role="status">Loading knowledge...</p> : null}

      <section id="company-documents" className="mt-8" aria-labelledby="documents-heading">
        <h2 id="documents-heading" className="flex items-center gap-2 text-lg font-semibold text-ink">
          <FileText aria-hidden="true" className="h-5 w-5 text-primary" />
          Company documents
        </h2>
        {!loading && companyDocuments.length === 0 ? <p className="mt-3 text-sm text-muted">No published company documents yet.</p> : null}
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {companyDocuments.map((document) => (
            <li key={document.id} className="fade-up">
              <Link to={`/knowledge/documents/${document.id}`} className="block h-full rounded-2xl border border-line bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary">
                <Badge>{document.category}</Badge>
                <h3 className="mt-3 font-semibold text-ink">{document.title}</h3>
                {document.description ? <p className="mt-2 text-sm text-muted">{document.description}</p> : null}
                <p className="mt-3 text-sm text-muted">{formatDate(document.updatedAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="learning-documents" className="mt-10" aria-labelledby="learning-documents-heading">
        <h2 id="learning-documents-heading" className="flex items-center gap-2 text-lg font-semibold text-ink">
          <GraduationCap aria-hidden="true" className="h-5 w-5 text-accent" />
          Learning documents
        </h2>
        {!loading && learningDocuments.length === 0 ? <p className="mt-3 text-sm text-muted">No published learning documents yet.</p> : null}
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {learningDocuments.map((document) => {
            const link = String(document.sourceUrl || '');
            const className = 'block h-full rounded-2xl border border-line bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary';
            const body = (
              <>
                <Badge>{document.category}</Badge>
                <h3 className="mt-3 font-semibold text-ink">{document.title}</h3>
                {document.description ? <p className="mt-2 text-sm text-muted">{document.description}</p> : null}
                <p className="mt-3 text-sm text-muted">{formatDate(document.updatedAt)}</p>
                {link.startsWith('https://') ? (
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                    Open document
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  </span>
                ) : null}
              </>
            );
            return (
              <li key={document.id} className="fade-up">
                {link.startsWith('https://') ? (
                  <a href={link} target="_blank" rel="noopener noreferrer" className={className} aria-label={`${document.title}. Opens the original link in a new tab.`}>
                    {body}
                    <span className="sr-only">Opens externally</span>
                  </a>
                ) : (
                  <Link to={`/knowledge/documents/${document.id}`} className={className}>{body}</Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section id="videos" className="mt-10" aria-labelledby="learning-heading">
        <h2 id="learning-heading" className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Video aria-hidden="true" className="h-5 w-5 text-secondary" />
          Learning videos
        </h2>
        {!loading && visibleResources.length === 0 ? <p className="mt-3 text-sm text-muted">No learning videos yet.</p> : null}
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleResources.map((resource) => (
            <li key={resource.id}><ResourceCard resource={resource} /></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
