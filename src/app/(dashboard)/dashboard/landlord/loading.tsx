export default function LandlordLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* Banner skeleton */}
      <div className="h-16 bg-stone-100 dark:bg-slate-800 rounded-2xl" />

      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-stone-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-4 w-64 bg-stone-100 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="h-11 w-40 bg-stone-100 dark:bg-slate-800 rounded-2xl" />
      </div>

      {/* Cards skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-stone-100 dark:bg-slate-800 rounded-2xl" />
      ))}
    </div>
  );
}
