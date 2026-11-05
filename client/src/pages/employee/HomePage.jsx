import { useState } from 'react';
import { ArrowRight, BookOpen, Bot, FileText, FolderKanban, GraduationCap, Search, SendHorizontal, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import ResourceCard from '../../components/ResourceCard.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { askQuestion } from '../../services/knowledge.js';
import { getErrorMessage } from '../../utils/errors.js';
import { greeting } from '../../utils/greeting.js';

const suggestions = [
  'What is our WFH policy?',
  'What is our leave policy?',
  'When are the company holidays?',
  'Is there a video I should watch?',
];

function HeroArt() {
  return (
    <div className="relative mx-auto h-40 w-40 shrink-0 sm:h-48 sm:w-48" aria-hidden="true">
      <div className="glow-pulse absolute inset-4 rounded-full bg-gradient-to-br from-indigo-400 via-sky-300 to-teal-300 blur-2xl" />
      <div className="orbit absolute inset-0">
        <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-indigo-400 shadow-[0_0_12px_#818cf8]" />
        <span className="absolute bottom-3 right-3 h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_10px_#2dd4bf]" />
      </div>
      <div className="orbit-reverse absolute inset-5 rounded-full border border-dashed border-indigo-300/70">
        <Sparkles className="absolute -left-2 top-1/3 h-5 w-5 text-amber-400" />
      </div>
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="bot-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
        <line x1="60" y1="22" x2="60" y2="30" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="19" r="4" fill="#f59e0b" />
        <rect x="30" y="30" width="60" height="46" rx="16" fill="url(#bot-body)" />
        <rect x="38" y="40" width="44" height="26" rx="10" fill="#0f172a" opacity="0.88" />
        <circle cx="52" cy="53" r="5" fill="#67e8f9" />
        <circle cx="68" cy="53" r="5" fill="#67e8f9" />
        <rect x="46" y="80" width="28" height="16" rx="8" fill="url(#bot-body)" opacity="0.85" />
        <g className="lens-scan">
          <circle cx="86" cy="82" r="14" fill="#ffffff" fillOpacity="0.55" stroke="#4f46e5" strokeWidth="4" />
          <path d="M96 92 L108 104" stroke="#4f46e5" strokeWidth="6" strokeLinecap="round" />
          <path d="M79 76 Q84 71 90 74" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      </svg>
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-md shadow-indigo-200">
      <Bot aria-hidden="true" className="h-5 w-5" />
    </div>
  );
}

function UserAvatar({ name }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
      {(name || '?').trim().charAt(0).toUpperCase()}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="pop-in flex items-start gap-3" role="status">
      <BotAvatar />
      <div className="rounded-2xl rounded-tl-sm border border-indigo-100 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="typing-dot h-2 w-2 rounded-full bg-primary" style={{ animationDelay: `${dot * 0.18}s` }} />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Searching approved company sources...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');
  const team = user?.team?.trim();

  useDocumentTitle('Ask AI');

  async function submit(text) {
    const nextQuestion = text.trim();
    if (!nextQuestion || asking) return;
    setQuestion('');
    setError('');
    setAsking(true);
    setMessages([{ id: crypto.randomUUID(), role: 'user', text: nextQuestion }]);
    try {
      const result = await askQuestion(nextQuestion);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', result }]);
    } catch (err) {
      setError(getErrorMessage(err, 'The assistant is unavailable right now. Try again.'));
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6 shadow-sm sm:p-8">
        <div className="blob-drift pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-indigo-200/50 blur-3xl" aria-hidden="true" />
        <div className="blob-drift pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-teal-200/50 blur-3xl" style={{ animationDelay: '-4s' }} aria-hidden="true" />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <HeroArt />
          <div className="text-center sm:text-left">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-accent ring-1 ring-teal-100">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> AI knowledge assistant
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {greeting()}, <span className="shimmer-text">{user?.name?.split(' ')[0] || 'there'}</span> <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-2 text-lg text-muted">What do you want to know about the company?</p>
            <p className="mt-1 text-sm text-muted">{`Signed in as ${user?.name}${team ? ` · ${team}` : ''}.`}</p>
          </div>
        </div>
      </section>

      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          submit(question);
        }}
      >
        <label htmlFor="ask" className="sr-only">Ask anything about your company</label>
        <div className="flex flex-col gap-3 rounded-3xl bg-gradient-to-r from-indigo-300 via-sky-300 to-teal-300 p-0.5 shadow-lg shadow-indigo-100 sm:flex-row sm:items-center sm:p-1">
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
            <input
              id="ask"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask anything about your company..."
              className="min-h-14 w-full rounded-[1.35rem] border-0 bg-white py-3 pl-12 pr-4 text-base text-ink placeholder:text-slate-400"
              disabled={asking}
            />
          </div>
          <Button
            type="submit"
            className="min-h-12 rounded-2xl bg-gradient-to-r from-primary to-secondary px-6 sm:mr-1 sm:min-w-28"
            loading={asking}
            loadingLabel="Asking..."
          >
            <SendHorizontal aria-hidden="true" className="h-4 w-4" />
            Ask
          </Button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <button
            key={item}
            type="button"
            className="rounded-full border border-line bg-white px-3.5 py-2 text-left text-sm text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow"
            onClick={() => submit(item)}
            disabled={asking}
          >
            {item}
          </button>
        ))}
      </div>

      {error ? <div className="mt-4"><Alert tone="error">{error}</Alert></div> : null}

      <div className="mt-8 space-y-6" aria-live="polite">
        {messages.map((message) => (
          message.role === 'user' ? (
            <div key={message.id} className="pop-in flex items-start justify-end gap-3">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary to-secondary px-5 py-3 text-white shadow-md shadow-indigo-200">
                <p className="text-xs font-medium text-indigo-100">You asked</p>
                <p className="mt-1 whitespace-pre-wrap">{message.text}</p>
              </div>
              <UserAvatar name={user?.name} />
            </div>
          ) : (
            <div key={message.id} className="pop-in flex items-start gap-3">
              <BotAvatar />
              <article className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-indigo-100 bg-white p-5 shadow-sm">
                <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
                  <Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> AI answer
                </h2>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-ink">{message.result.answer}</p>
                {message.result.mode === 'mock' ? (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Mock mode. This uses approved company text and saved resource details. OpenAI is not called.
                  </p>
                ) : null}
                {message.result.sources?.length ? (
                  <div className="mt-5 border-t border-line pt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Sources</h3>
                    <ul className="mt-3 space-y-3">
                      {message.result.sources.map((source) => (
                        <li key={source.id} className="rounded-xl border border-line bg-slate-50 p-3">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-primary">
                              <FileText aria-hidden="true" className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-ink">{source.title}</p>
                              {source.excerpt ? <p className="mt-1 line-clamp-3 text-sm text-muted">{source.excerpt}</p> : null}
                              <Link to={source.path} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                                View source <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {message.result.resources?.length ? (
                  <div className="mt-4 grid gap-4">
                    {message.result.resources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
                  </div>
                ) : null}
                {!message.result.sufficientEvidence ? (
                  <Link to="/knowledge" className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline">
                    Browse company knowledge <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                ) : null}
                {message.result.relatedQuestions?.length ? (
                  <div className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Related questions</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.result.relatedQuestions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className="rounded-full bg-indigo-50 px-3 py-1.5 text-left text-sm text-primary transition hover:bg-indigo-100"
                          onClick={() => submit(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            </div>
          )
        ))}
        {asking ? <TypingIndicator /> : null}
      </div>

      <section className="mt-12" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Sparkles aria-hidden="true" className="h-5 w-5 text-primary" />
          Frequently asked
        </h2>
        <p className="mt-2 text-sm text-muted">Choose a question to search the approved company documents and learning resources.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {suggestions.map((item, index) => (
            <li key={item} className="fade-up" style={{ animationDelay: `${index * 70}ms` }}>
              <button
                type="button"
                className="flex h-full w-full cursor-pointer items-start gap-3 rounded-2xl border border-line bg-card p-4 text-left text-sm text-ink transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md disabled:cursor-not-allowed"
                onClick={() => submit(item)}
                disabled={asking}
              >
                <Search aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Browse knowledge">
        <Link to="/knowledge#company-documents" className="rounded-2xl border border-line bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary">
          <BookOpen aria-hidden="true" className="h-5 w-5 text-primary" />
          <p className="mt-3 font-medium text-ink">Company documents</p>
          <p className="mt-1 text-sm text-muted">Leave, WFH, holidays, and policies.</p>
        </Link>
        <Link to="/knowledge#learning-documents" className="rounded-2xl border border-line bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary">
          <GraduationCap aria-hidden="true" className="h-5 w-5 text-accent" />
          <p className="mt-3 font-medium text-ink">Learning documents</p>
          <p className="mt-1 text-sm text-muted">Guides uploaded for training.</p>
        </Link>
        <Link to="/projects" className="rounded-2xl border border-line bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary">
          <FolderKanban aria-hidden="true" className="h-5 w-5 text-secondary" />
          <p className="mt-3 font-medium text-ink">Projects</p>
          <p className="mt-1 text-sm text-muted">Cards and documentation for each project.</p>
        </Link>
      </section>
    </div>
  );
}
