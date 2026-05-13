export default function PropertiesLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-stone-100 dark:bg-slate-800 rounded-xl" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 bg-stone-100 dark:bg-slate-800 rounded-2xl" />
      ))}
    </div>
  );
}
