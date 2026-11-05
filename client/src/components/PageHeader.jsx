export default function PageHeader({ eyebrow, title, description }) {
  return (
    <header className="fade-up mb-8">
      {eyebrow ? <p className="mb-2 text-sm font-medium text-accent">{eyebrow}</p> : null}
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
      <span aria-hidden="true" className="mt-3 block h-1 w-14 rounded-full bg-gradient-to-r from-primary via-secondary to-teal-400" />
      {description ? <p className="mt-3 max-w-2xl text-muted">{description}</p> : null}
    </header>
  );
}
