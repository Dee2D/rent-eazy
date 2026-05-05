import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <span className="text-7xl mb-4">🏚️</span>
      <h1 className="text-3xl font-bold text-stone-900 mb-2">Page Not Found</h1>
      <p className="text-stone-500 text-sm mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link
        href="/"
        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
