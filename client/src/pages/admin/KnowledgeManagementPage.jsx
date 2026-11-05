import { FileText, FolderKanban, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { getKnowledgeCounts } from '../../services/knowledge.js';

const sections = [
  {
    to: '/admin/documents',
    title: 'Company Documents',
    description: 'Upload leave, WFH, holiday, and other policy files. Published files can answer employee questions.',
    icon: FileText,
    countKey: 'documents',
  },
  {
    to: '/admin/learning',
    title: 'Learning Resources',
    description: 'Upload learning documents, or add a video link with a thumbnail. Asking for a video suggests that resource.',
    icon: GraduationCap,
    countKey: 'resources',
  },
  {
    to: '/admin/projects',
    title: 'Projects',
    description: 'Add a project image, owner, site, and documentation file. Employees open the card to read it.',
    icon: FolderKanban,
    countKey: 'projects',
  },
];

export default function KnowledgeManagementPage() {
  const [counts, setCounts] = useState(null);
  useDocumentTitle('Knowledge Management');

  useEffect(() => {
    getKnowledgeCounts().then(setCounts).catch(() => setCounts(null));
  }, []);

  return (
    <div>
      <PageHeader
        title="Knowledge Management"
        description="Add the company files and learning links employees can ask about."
      />
      <ul className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const count = counts?.[section.countKey];
          return (
            <li key={section.to}>
              <Link to={section.to} className="card-lift flex h-full flex-col rounded-2xl border border-line bg-card p-5 hover:border-primary">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-indigo-200">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h2 className="mt-3 text-lg font-semibold text-ink">{section.title}</h2>
                {count ? (
                  <p className="mt-1 text-2xl font-semibold text-ink">
                    {count.total}
                    <span className="ml-2 text-sm font-normal text-muted">{count.published} published</span>
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-muted">{section.description}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
