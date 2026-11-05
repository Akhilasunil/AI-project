import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import ProjectImage from '../../components/ProjectImage.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { downloadProjectDocument, getProject } from '../../services/projects.js';
import { formatDate } from '../../utils/catalog.js';
import { getErrorMessage } from '../../utils/errors.js';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useDocumentTitle(record?.project.name || 'Project');

  useEffect(() => {
    getProject(id)
      .then(setRecord)
      .catch((err) => setError(getErrorMessage(err, 'This project is not available.')));
  }, [id]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadProjectDocument(record.project.id, record.project.originalName);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not download the project documentation.'));
    } finally {
      setDownloading(false);
    }
  }

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!record) return <p className="text-sm text-muted" role="status">Loading project...</p>;

  const { project } = record;

  return (
    <article>
      <Link to="/projects" className="text-sm font-medium text-primary">Back to projects</Link>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
        <ProjectImage project={project} />
        <div className="p-5 sm:p-6">
          <h1 className="text-3xl font-semibold text-ink">{project.name}</h1>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Project owner</dt>
              <dd className="mt-1 font-medium text-ink">{project.ownerName}</dd>
            </div>
            {project.department ? (
              <div>
                <dt className="text-muted">Department</dt>
                <dd className="mt-1 font-medium text-ink">{project.department}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted">Updated</dt>
              <dd className="mt-1 font-medium text-ink">{formatDate(project.updatedAt)}</dd>
            </div>
          </dl>
          {project.summary ? <p className="mt-4 text-muted">{project.summary}</p> : null}
          {project.siteUrl ? (
            <a
              href={project.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
            >
              Open project site
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only">Opens externally</span>
            </a>
          ) : null}
        </div>
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-indigo-50 px-5 py-4 sm:px-8">
          <div>
            <h2 className="text-lg font-semibold text-ink">Documentation</h2>
            <p className="mt-1 text-sm text-muted">Text read from the file added for this project.</p>
          </div>
          <Button type="button" onClick={handleDownload} loading={downloading} loadingLabel="Downloading...">
            Download
          </Button>
        </div>
        <div className="px-5 py-6 sm:px-8 sm:py-8">
          {record.text ? (
            record.text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean).map((block, index) => (
              <p key={index} className="mb-5 whitespace-pre-wrap text-base leading-7 text-ink last:mb-0">
                {block}
              </p>
            ))
          ) : (
            <p className="text-sm text-muted">No readable text was stored.</p>
          )}
        </div>
      </section>
    </article>
  );
}
