export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-[74px] rounded-2xl bg-stone-100" />)}
      </div>
      <div className="h-11 rounded-xl bg-stone-100" />
      <div className="h-[70vh] min-h-[420px] rounded-2xl bg-stone-100" />
    </div>
  );
}
