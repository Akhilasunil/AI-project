import { useEffect, useState } from 'react';
import { CircleCheck, CircleHelp, Lightbulb, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import Alert from '../../components/ui/Alert.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { getAdminSummary } from '../../services/knowledge.js';
import { formatDate } from '../../utils/catalog.js';
import { getErrorMessage } from '../../utils/errors.js';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  useDocumentTitle('Dashboard');

  useEffect(() => {
    getAdminSummary().then(setSummary).catch((err) => setError(getErrorMessage(err, 'Could not load the dashboard.')));
  }, []);

  const cards = summary
    ? [
      ['Questions asked', summary.asked, MessageSquare, 'from-indigo-500 to-sky-500'],
      ['Questions answered', summary.answered, CircleCheck, 'from-emerald-500 to-teal-400'],
      ['Unanswered questions', summary.unanswered, CircleHelp, 'from-amber-500 to-orange-400'],
      ['Knowledge gaps', summary.gaps, Lightbulb, 'from-rose-500 to-pink-400'],
    ]
    : [];

  return (
    <div>
      <PageHeader title="Dashboard" description="Counts come from questions employees have asked." />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {!summary && !error ? <p className="text-sm text-muted" role="status">Loading dashboard...</p> : null}
      {summary ? (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(([label, value, Icon, tint], index) => (
              <li key={label} className="fade-up card-lift rounded-2xl border border-line bg-card p-5" style={{ animationDelay: `${index * 70}ms` }}>
                <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tint} text-white shadow-md`}>
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <p className="mt-4 text-sm text-muted">{label}</p>
                <p className="mt-1 text-3xl font-semibold text-ink">{value}</p>
              </li>
            ))}
          </ul>
          {summary.asked === 0 ? <p className="mt-6 text-sm text-muted">No questions have been asked yet.</p> : null}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="text-lg font-semibold text-ink">Most asked topics</h2>
              {summary.topics.length === 0 ? <p className="mt-3 text-sm text-muted">No topics yet.</p> : (
                <ul className="mt-3 space-y-2">
                  {summary.topics.map((topic) => (
                    <li key={topic.topic} className="flex justify-between rounded-xl border border-line bg-card px-4 py-3 text-sm">
                      <span>{topic.topic}</span>
                      <span className="text-muted">{topic.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h2 className="text-lg font-semibold text-ink">Recent unanswered questions</h2>
              {summary.recentGaps.length === 0 ? <p className="mt-3 text-sm text-muted">No unanswered questions.</p> : (
                <ul className="mt-3 space-y-2">
                  {summary.recentGaps.map((gap) => (
                    <li key={gap.id} className="rounded-xl border border-line bg-card px-4 py-3 text-sm">
                      <p className="text-ink">{gap.question}</p>
                      <p className="mt-1 text-muted">Asked {gap.askCount} {gap.askCount === 1 ? 'time' : 'times'} · {formatDate(gap.lastAskedAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/admin/gaps" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary">Review knowledge gaps</Link>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
