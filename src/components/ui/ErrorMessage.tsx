import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
