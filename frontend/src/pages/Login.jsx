import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { isValidEmail } from '../utils/validators.js';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (form.email && !isValidEmail(form.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const u = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${u.full_name || u.email}!`);
      nav('/dashboard');
    } catch (error) {
      console.error('LOGIN ERROR:', error.response?.data || error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Login failed. Check your email and password.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'peer block w-full rounded-2xl border-2 border-slate-100 bg-slate-50 py-3.5 pl-14 text-[15px] font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15';

  const iconChip =
    'pointer-events-none absolute left-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition peer-focus:bg-gradient-to-br peer-focus:from-emerald-500 peer-focus:to-teal-600 peer-focus:text-white peer-focus:ring-transparent peer-focus:shadow-emerald-500/30';

  return (
    <div className="dmms-login relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap');
        .dmms-login { font-family: 'Figtree', ui-sans-serif, system-ui, sans-serif; }
        .dmms-login .font-display { font-family: 'Bricolage Grotesque', 'Figtree', ui-sans-serif, sans-serif; }
        @keyframes lg-rise { from { opacity: 0; transform: translateY(24px) scale(.97); } to { opacity: 1; transform: none; } }
        @keyframes lg-drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-30px) scale(1.1); } }
        @keyframes lg-spin { to { transform: rotate(360deg); } }
        @keyframes lg-shimmer { 0% { transform: translateX(-120%) skewX(-20deg); } 60%,100% { transform: translateX(260%) skewX(-20deg); } }
        @keyframes lg-gradient { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .lg-rise { animation: lg-rise .8s cubic-bezier(.2,.8,.2,1) both; }
        .lg-drift { animation: lg-drift 16s ease-in-out infinite; }
        .lg-drift-b { animation: lg-drift 20s ease-in-out infinite reverse; }
        .lg-ring { animation: lg-spin 10s linear infinite; }
        .lg-btn { background-size: 200% 200%; animation: lg-gradient 6s ease infinite; }
        .lg-shimmer { animation: lg-shimmer 3.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .lg-rise, .lg-drift, .lg-drift-b, .lg-ring, .lg-btn, .lg-shimmer { animation: none; }
        }
      `}</style>

      {/* back link */}
      <Link
        to="/"
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-emerald-700 sm:left-8 sm:top-8"
      >
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>

      {/* ───────── Card ───────── */}
      <div className="lg-rise relative w-full max-w-md">
        {/* gradient border */}
        <div className="rounded-[2rem] bg-gradient-to-br from-amber-300 via-emerald-300 to-teal-400 p-[2px] shadow-[0_25px_70px_-15px_rgba(6,78,59,0.30),0_8px_24px_-8px_rgba(15,23,42,0.12)]">
          <div className="relative rounded-[calc(2rem-2px)] bg-white px-7 pb-8 pt-16 sm:px-10">
            {/* floating logo badge */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="lg-ring absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#fbbf24,#34d399,#2dd4bf,#fbbf24)] opacity-90 blur-[2px]" />
                <div className="relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-xl shadow-amber-500/40 ring-4 ring-white">
                  <Building2 className="h-8 w-8 text-emerald-950" />
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">DMMS</p>
              <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Welcome{' '}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 bg-clip-text text-transparent">
                  back
                </span>
              </h1>
              <p className="mt-2 text-[15px] text-slate-500">Sign in with your email to open your dashboard.</p>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    className={inputClass}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <span className={iconChip}>
                    <Mail className="h-[18px] w-[18px]" />
                  </span>
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    className={`${inputClass} pr-14`}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <span className={iconChip}>
                    <Lock className="h-[18px] w-[18px]" />
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`group relative mt-3 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-4 text-base font-extrabold text-white shadow-xl transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50 ${
                  loading
                    ? 'cursor-not-allowed bg-emerald-700/70 shadow-none'
                    : 'lg-btn bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 shadow-emerald-600/40 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-600/50 active:translate-y-0'
                }`}
              >
                {!loading && (
                  <span className="lg-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/30 blur-md" />
                )}
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span className="relative">Sign in</span>
                    <ArrowRight className="relative h-5 w-5 transition group-hover:translate-x-1.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              Staff access only. Need an account? Contact your administrator.
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} DMMS. All rights reserved.
        </p>
      </div>
    </div>
  );
}