export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-indigo-200 bg-gradient-to-b from-indigo-50/60 to-white px-6 py-14 text-center">
      <div aria-hidden="true" className="blob-drift pointer-events-none absolute -top-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl" />
      {Icon ? (
        <span className="float-soft relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-indigo-200">
          <Icon aria-hidden="true" className="h-7 w-7" />
        </span>
      ) : null}
      <h2 className="relative mt-5 text-lg font-semibold text-ink">{title}</h2>
      <p className="relative mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
    </div>
  );
}
