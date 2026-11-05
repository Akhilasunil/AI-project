import RequiredMark from './RequiredMark.jsx';

export default function FilePicker({
  id,
  label,
  hint,
  accept,
  multiple = false,
  required = false,
  selected = [],
  onChange,
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">
        {label}
        {required ? <RequiredMark /> : null}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={id}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Choose file
        </label>
        <span className="text-sm text-muted">{selected.length ? selected.join(', ') : 'No file chosen'}</span>
      </div>
      <input
        id={id}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        required={required}
        onChange={onChange}
      />
      {hint ? <p className="mt-1.5 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
