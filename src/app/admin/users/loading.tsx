export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading users">
      <div className="h-11 max-w-md rounded-xl bg-stone-100" />
      <div className="h-[65vh] min-h-[360px] rounded-2xl bg-stone-100" />
    </div>
  );
}
