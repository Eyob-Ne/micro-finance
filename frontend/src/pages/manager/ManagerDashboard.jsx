import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  RefreshCw,
  BarChart3,
  Users,
  LineChart,
} from 'lucide-react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

/* Manager brand: royal violet + fuchsia, with a gold accent */
const TONES = {
  violet: { tile: 'from-violet-500 to-purple-700', glow: 'shadow-violet-500/30', soft: 'bg-violet-50' },
  green: { tile: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30', soft: 'bg-emerald-50' },
  sky: { tile: 'from-sky-500 to-blue-600', glow: 'shadow-sky-500/30', soft: 'bg-sky-50' },
  red: { tile: 'from-rose-500 to-red-600', glow: 'shadow-rose-500/30', soft: 'bg-rose-50' },
};

const BAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-fuchsia-500 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-slate-400 to-slate-600',
];

const ACTIONS = [
  {
    to: '/loans',
    label: 'Approve loans',
    hint: 'Review pending applications',
    icon: CheckCircle,
    tile: 'from-violet-500 to-purple-700',
    glow: 'shadow-violet-500/30',
  },
  {
    to: '/repayments',
    label: 'Follow up overdue',
    hint: 'See who is past due',
    icon: AlertTriangle,
    tile: 'from-rose-500 to-red-600',
    glow: 'shadow-rose-500/30',
  },
  {
    to: '/reports',
    label: 'Staff performance',
    hint: 'Officer results and totals',
    icon: Users,
    tile: 'from-amber-400 to-orange-500',
    glow: 'shadow-orange-500/30',
  },
];

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />;
}

function StatCard({ title, value, icon: Icon, tone, hint, loading }) {
  const t = TONES[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full ${t.soft} opacity-90 transition duration-300 group-hover:scale-125`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {loading ? (
            <>
              <Skeleton className="mt-3 h-8 w-28" />
              <Skeleton className="mt-3 h-3 w-24" />
            </>
          ) : (
            <>
              <h3 className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
              {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
            </>
          )}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${t.tile} text-white shadow-lg ${t.glow}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const auth = useAuth();
  const user = auth?.user;

  const [stats, setStats] = useState({});
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, portRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/reports/portfolio'),
      ]);
      setStats(dashRes.data || {});
      setPortfolio(portRes.data || null);
    } catch (error) {
      toast.error('Failed to load manager statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val) => `ETB ${Number(val || 0).toLocaleString()}`;

  const firstName = (user?.full_name || user?.username || user?.email || 'there').split(' ')[0];

  const disbursed = Number(stats.total_disbursed_amount || 0);
  const collected = Number(stats.total_repayments_collected || 0);
  const overdue = Number(stats.total_overdue_amount || 0);
  const collectionRate = disbursed > 0 ? Math.min(100, Math.round((collected / disbursed) * 100)) : 0;
  const overdueShare = disbursed > 0 ? Math.min(100, Math.round((overdue / disbursed) * 100)) : 0;

  const products = portfolio?.by_product || [];
  const maxPrincipal = Math.max(...products.map((x) => Number(x.total_principal) || 0), 1);
  const totalPrincipal = products.reduce((s, x) => s + (Number(x.total_principal) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950 via-purple-800 to-fuchsia-600 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-60 w-60 rounded-full bg-pink-400/25 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-amber-200 backdrop-blur">
              <LineChart className="h-3.5 w-3.5" /> Manager dashboard
            </span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome back, {firstName}</h1>
            <p className="mt-2 max-w-md text-violet-100/85">
              Monitor your loan portfolio and team performance.
            </p>
            <button
              onClick={fetchData}
              disabled={loading}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-bold text-violet-950 shadow-lg shadow-amber-400/25 transition hover:bg-amber-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Portfolio health */}
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
            <p className="text-sm font-semibold text-violet-100/90">Portfolio health</p>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-violet-100/85">Collected vs disbursed</span>
                <span className="font-bold">{loading ? '...' : `${collectionRate}%`}</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-400 transition-all duration-700"
                  style={{ width: loading ? '0%' : `${collectionRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-violet-100/85">Overdue vs disbursed</span>
                <span className="font-bold">{loading ? '...' : `${overdueShare}%`}</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-300 to-rose-500 transition-all duration-700"
                  style={{ width: loading ? '0%' : `${overdueShare}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Disbursed portfolio"
          value={formatCurrency(stats.total_disbursed_amount)}
          icon={Wallet}
          tone="violet"
          loading={loading}
        />
        <StatCard
          title="Total collected"
          value={formatCurrency(stats.total_repayments_collected)}
          icon={TrendingUp}
          tone="green"
          loading={loading}
        />
        <StatCard
          title="Active loans"
          value={stats.active_loans_count || 0}
          icon={CheckCircle}
          tone="sky"
          loading={loading}
          hint={`Out of ${stats.total_loans_count || 0} total loans`}
        />
        <StatCard
          title="Overdue amount"
          value={formatCurrency(stats.total_overdue_amount)}
          icon={AlertTriangle}
          tone="red"
          loading={loading}
          hint={`${stats.overdue_loans_count || 0} loans overdue`}
        />
      </section>

      {/* Middle row */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Portfolio by product */}
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-md shadow-violet-500/30">
                  <BarChart3 className="h-5 w-5" />
                </span>
                Portfolio by product
              </h2>
              <p className="mt-1 text-sm text-slate-500">Principal issued per loan product</p>
            </div>
            <Link
              to="/reports"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-600 hover:text-white"
            >
              Full report <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-5">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="mt-3 h-3 w-full" />
                </div>
              ))}
            </div>
          ) : !products.length ? (
            <div className="py-14 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No product data yet</h3>
              <p className="mt-1 text-sm text-slate-500">No loan products data available.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {products.map((p, idx) => {
                const principal = Number(p.total_principal) || 0;
                const pct = (principal / maxPrincipal) * 100;
                const share = totalPrincipal > 0 ? Math.round((principal / totalPrincipal) * 100) : 0;
                return (
                  <div key={p.product_id}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-semibold text-slate-800">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-500">
                          {idx + 1}
                        </span>
                        {p.product_name}
                      </span>
                      <span className="font-bold text-slate-900">{formatCurrency(p.total_principal)}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${BAR_GRADIENTS[idx % BAR_GRADIENTS.length]} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-xs text-slate-500">
                      <span>{p.loans_count} loans issued</span>
                      <span>{share}% of portfolio</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Team actions */}
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Team actions</h2>
          <p className="mb-5 text-sm text-slate-500">What needs your attention</p>

          <div className="space-y-3">
            {ACTIONS.map(({ to, label, hint, icon: Icon, tile, glow }) => (
              <Link
                key={label}
                to={to}
                className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50 hover:shadow-md"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tile} text-white shadow-md ${glow}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800">{label}</span>
                  <span className="block truncate text-xs text-slate-500">{hint}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-700" />
              </Link>
            ))}
          </div>

          {!loading && Number(stats.overdue_loans_count) > 0 && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-white p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <p className="text-sm text-rose-800">
                <strong>{stats.overdue_loans_count}</strong> loans are overdue, totaling{' '}
                <strong>{formatCurrency(stats.total_overdue_amount)}</strong>.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}