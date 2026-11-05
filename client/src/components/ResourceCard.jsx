import { ExternalLink } from 'lucide-react';
import Badge from './ui/Badge.jsx';
import ResourceImage from './ResourceImage.jsx';

export default function ResourceCard({ resource }) {
  const label = `${resource.title}, ${resource.resourceType}. Opens the original link in a new tab.`;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm hover:border-primary card-lift">
      <ResourceImage resource={resource} />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="primary">{resource.resourceType}</Badge>
          <Badge>{resource.category}</Badge>
        </div>
        <h3 className="mt-3 text-base font-semibold text-ink">{resource.title}</h3>
        {resource.description ? <p className="mt-2 line-clamp-3 text-sm text-muted">{resource.description}</p> : null}
        {String(resource.resourceUrl || '').startsWith('https://') ? (
          <a
            href={resource.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
          >
            Open resource
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">Opens externally</span>
          </a>
        ) : (
          <p className="mt-4 text-sm text-muted">Add an HTTPS link to open this resource.</p>
        )}
      </div>
    </article>
  );
}
