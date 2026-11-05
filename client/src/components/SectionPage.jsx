import EmptyState from './EmptyState.jsx';
import PageHeader from './PageHeader.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function SectionPage({ title, description, emptyTitle, emptyDescription, icon }) {
  useDocumentTitle(title);

  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
    </div>
  );
}
