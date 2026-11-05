import Spinner from './ui/Spinner.jsx';

export default function FullPageSpinner() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas">
      <p className="flex items-center gap-3 text-muted" role="status">
        <Spinner className="h-5 w-5 text-primary" />
        Loading Company AI
      </p>
    </div>
  );
}
