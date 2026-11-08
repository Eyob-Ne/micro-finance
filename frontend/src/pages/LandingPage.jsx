import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, ShieldCheck, Users, TrendingUp, Lock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20">
            D
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight">DMMS</span>
            <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 uppercase tracking-widest font-semibold">
              Microfinance System
            </span>
          </div>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20"
        >
          <span>Sign In</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-20 flex-1 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-8">
          <ShieldCheck className="h-4 w-4" /> Secure Enterprise Microfinance
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl">
          Empowering Financial Inclusion with{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Modern Lending
          </span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          Comprehensive loan lifecycle management, automated repayments, savings ledger,
          and robust role-based audit control built for modern microfinance institutions.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base transition shadow-xl shadow-emerald-500/25"
          >
            <span>Access Portal</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-4xl w-full">
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 backdrop-blur">
            <Users className="h-8 w-8 text-emerald-400 mb-3" />
            <h2 className="font-bold text-base text-white">Client KYC & Accounts</h2>
            <p className="mt-2 text-sm text-slate-400">
              Manage client records, national IDs, documents, and real-time active loan portfolios.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 backdrop-blur">
            <TrendingUp className="h-8 w-8 text-teal-400 mb-3" />
            <h2 className="font-bold text-base text-white">Automated Schedules</h2>
            <p className="mt-2 text-sm text-slate-400">
              Accurate flat-rate & reducing balance amortization, penalties, and instant repayment logging.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 backdrop-blur">
            <Lock className="h-8 w-8 text-cyan-400 mb-3" />
            <h2 className="font-bold text-base text-white">Role-Based Auditing</h2>
            <p className="mt-2 text-sm text-slate-400">
              Granular permissions for Admins, Managers, Loan Officers, and Cashiers with full audit tracking.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-800 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} DMMS — Digital Microfinance Management System. All rights reserved.
      </footer>
    </div>
  );
}
