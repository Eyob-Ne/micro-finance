import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Wallet,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  DollarSign,
  CheckCircle,
  UserCog,
  PiggyBank,
} from 'lucide-react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';

const TONES = {
  blue: { tile: 'from-sky-500 to-blue-600', glow: 'shadow-blue-500/30', soft: 'bg-sky-50', text: 'text-sky-700', ring: 'border-sky-100' },
  green: { tile: 'from-emerald-500 to-emerald-700', glow: 'shadow-emerald-500/30', soft: 'bg-emerald-50', text: 'text-emerald-700', ring: 'border-emerald-100' },
  purple: { tile: 'from-violet-500 to-purple-700', glow: 'shadow-purple-500/30', soft: 'bg-violet-50', text: 'text-violet-700', ring: 'border-violet-100' },
  red: { tile: 'from-rose-500 to-red-600', glow: 'shadow-red-500/30', soft: 'bg-rose-50', text: 'text-rose-700', ring: 'border-rose-100' },
  amber: { tile: 'from-amber-400 to-orange-500', glow: 'shadow-orange-500/30', soft: 'bg-amber-50', text: 'text-amber-700', ring: 'border-amber-100' },
};

const ACTIONS = [
  { to: '/users', label: 'Manage users', hint: 'Staff and roles', icon: UserCog, tone: 'blue' },
  { to: '/clients', label: 'Client directory', hint: 'Members and profiles', icon: Users, tone: 'green' },
  { to: '/loans', label: 'Loan portfolio', hint: 'Active and overdue loans', icon: Wallet, tone: 'purple' },
  { to: '/reports', label: 'Generate reports', hint: 'Export performance data', icon: TrendingUp, tone: 'amber' },
];

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />;
}

function StatCard({ title, value, icon: Icon, tone, loading }) {
  const t = TONES[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full ${t.soft} opacity-80 transition duration-300 group-hover:scale-125`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-20" />
          ) : (
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</h3>
          )}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${t.tile} text-white shadow-lg ${t.glow}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function MoneyTile({ label, value, icon: Icon, tone, loading }) {
  const t = TONES[tone];
  return (
    <div className={`rounded-2xl border ${t.ring} ${t.soft} p-4 transition hover:shadow-md`}>
      <div className={`flex items-center gap-2 text-sm font-semibold ${t.text}`}>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${t.tile} text-white`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="whitespace-nowrap">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-32" />
      ) : (
        <p className="mt-3 break-words text-xl font-bold text-slate-900">{value}</p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const auth = useAuth();
  const user = auth?.user;

  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/dashboard');
      setStats(data || {});
    } catch (error) {
      console.error('DASHBOARD ERROR:', error.response?.data || error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const money = (val) => `ETB ${Number(val || 0).toLocaleString()}`;
  const num = (val) => Number(val || 0).toLocaleString();

  const disbursed = Number(stats.total_disbursed_amount || 0);
  const collected = Number(stats.total_repayments_collected || 0);
  const rate = disbursed > 0 ? Math.min(100, Math.round((collected / disbursed) * 100)) : 0;

  const firstName = (user?.full_name || user?.email || 'Admin').split(' ')[0];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-600 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome back, {firstName}</h2>
            <p className="mt-2 max-w-md text-emerald-100/85">
              Here is how your microfinance system is performing today.
            </p>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-emerald-950 shadow-lg shadow-amber-400/25 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh data'}
            </button>
          </div>

          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-100/85">Repaid so far</span>
              <span className="font-bold">{loading ? '...' : `${rate}%`}</span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-400 transition-all duration-700"
                style={{ width: loading ? '0%' : `${rate}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-emerald-100/70">Repayments collected compared to total disbursed</p>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total clients" value={num(stats.total_clients)} icon={Users} tone="blue" loading={loading} />
        <StatCard title="Active clients" value={num(stats.active_clients)} icon={CheckCircle} tone="green" loading={loading} />
        <StatCard title="Active loans" value={num(stats.active_loans_count)} icon={Wallet} tone="purple" loading={loading} />
        <StatCard title="Overdue loans" value={num(stats.overdue_loans_count)} icon={AlertTriangle} tone="red" loading={loading} />
      </section>

      {/* Middle row */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Financial summary */}
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Financial summary</h2>
              <p className="text-sm text-slate-500">Money in and out of the system</p>
            </div>
            <Link
              to="/reports"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
            >
              View reports
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MoneyTile label="Disbursed" value={money(stats.total_disbursed_amount)} icon={TrendingUp} tone="blue" loading={loading} />
            <MoneyTile label="Collected" value={money(stats.total_repayments_collected)} icon={DollarSign} tone="green" loading={loading} />
            <MoneyTile label="Savings pool" value={money(stats.total_savings_balance)} icon={PiggyBank} tone="purple" loading={loading} />
          </div>

          {!loading && stats.overdue_loans_count > 0 && (
            <div className="mt-6 flex items-start gap-4 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-white p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-red-500/30">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-rose-900">Action needed on overdue loans</h4>
                <p className="mt-1 text-sm text-rose-700">
                  <strong>{num(stats.overdue_loans_count)}</strong> overdue loans totaling{' '}
                  <strong>{money(stats.total_overdue_amount)}</strong>. Ask your loan officers to follow up.
                </p>
                <Link
                  to="/loans"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/25 transition hover:bg-rose-700"
                >
                  Review loans
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
          <p className="mb-5 text-sm text-slate-500">Jump to common tasks</p>
          <div className="space-y-3">
            {ACTIONS.map(({ to, label, hint, icon: Icon, tone }) => {
              const t = TONES[tone];
              return (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50 hover:shadow-md"
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${t.tile} text-white shadow-md ${t.glow}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-800">{label}</span>
                    <span className="block truncate text-xs text-slate-500">{hint}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-700" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}