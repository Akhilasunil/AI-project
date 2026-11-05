import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProjectImage from './ProjectImage.jsx';

export default function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="card-lift group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm hover:border-primary"
    >
      <ProjectImage project={project} />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">{project.name}</h2>
          <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
        <p className="mt-1 text-sm text-muted">{project.ownerName}</p>
        {project.summary ? <p className="mt-2 line-clamp-3 text-sm text-muted">{project.summary}</p> : null}
        {project.department ? (
          <p className="mt-3">
            <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-900">{project.department}</span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}
