import { useEffect, useState } from 'react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ProjectCard from '../../components/ProjectCard.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { listProjects } from '../../services/projects.js';
import { getErrorMessage } from '../../utils/errors.js';

export default function ProjectsPage() {
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle('Projects');

  async function load(nextQuery = query) {
    setLoading(true);
    setError('');
    try {
      setProjects(await listProjects(nextQuery));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load projects.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load('');
  }, []);

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Published projects you are allowed to view. Open a card to read the project documentation."
      />
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          load();
        }}
      >
        <Input
          id="project-search"
          className="sm:min-w-80"
          label="Search"
          placeholder="Search projects..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="submit">Search</Button>
      </form>
      {error ? <div className="mt-4"><Alert tone="error">{error}</Alert></div> : null}
      {loading ? <p className="mt-6 text-sm text-muted" role="status">Loading projects...</p> : null}
      {!loading && projects.length === 0 ? <p className="mt-6 text-sm text-muted">No projects yet.</p> : null}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <li key={project.id}>
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
    </div>
  );
}
