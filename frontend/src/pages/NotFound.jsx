import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 shadow-sm ring-8 ring-amber-50/50">
        <FileQuestion className="h-10 w-10" />
      </div>
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
        404 Error
      </span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        404 — Page Not Found
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 active:translate-y-0"
      >
        <ArrowLeft className="h-4 w-4" /> Go to Dashboard
      </button>
    </div>
  );
}
