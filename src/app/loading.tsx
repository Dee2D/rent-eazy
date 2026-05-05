import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" />
    </div>
  );
}
