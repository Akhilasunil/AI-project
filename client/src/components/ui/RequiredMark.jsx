export default function RequiredMark() {
  return (
    <>
      <span className="text-danger" aria-hidden="true"> *</span>
      <span className="sr-only"> required</span>
    </>
  );
}
