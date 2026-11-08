import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 shadow-sm ring-8 ring-rose-50/50">
        <ShieldX className="h-10 w-10" />
      </div>
      <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
        403 Error
      </span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        403 — Access Denied
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        You don't have permission to view this page.
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
