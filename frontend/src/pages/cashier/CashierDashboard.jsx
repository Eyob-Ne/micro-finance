import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CreditCard,
  PiggyBank,
  Calendar,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  HandCoins,
  Phone,
  Receipt,
} from 'lucide-react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

/* Cashier brand: indigo + cyan, with a warm orange for "due today" */
const TONES = {
  cyan: { tile: 'from-cyan-500 to-sky-600', glow: 'shadow-cyan-500/30', soft: 'bg-cyan-50' },
  indigo: { tile: 'from-indigo-500 to-indigo-700', glow: 'shadow-indigo-500/30', soft: 'bg-indigo-50' },
  fuchsia: { tile: 'from-fuchsia-500 to-pink-600', glow: 'shadow-fuchsia-500/30', soft: 'bg-fuchsia-50' },
  orange: { tile: 'from-orange-400 to-rose-500', glow: 'shadow-orange-500/30', soft: 'bg-orange-50' },
};

const ACTIONS = [
  {
    to: '/repayments',
    label: 'Record repayment',
    hint: 'Take a loan payment',
    icon: HandCoins,
    tile: 'from-cyan-500 to-sky-600',
    glow: 'shadow-cyan-500/30',
  },
  {
    to: '/savings',
    label: 'Savings deposit',
    hint: 'Add money to an account',
    icon: ArrowDownCircle,
    tile: 'from-indigo-500 to-indigo-700',
    glow: 'shadow-indigo-500/30',
  },
  {
    to: '/savings',
    label: 'Savings withdrawal',
    hint: 'Pay out from an account',
    icon: ArrowUpCircle,
    tile: 'from-fuchsia-500 to-pink-600',
    glow: 'shadow-fuchsia-500/30',
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
              <Skeleton className="mt-3 h-3 w-20" />
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

export default function CashierDashboard() {
  const auth = useAuth();
  const user = auth?.user;

  const [collections, setCollections] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [collRes, schedRes] = await Promise.all([
        api.get('/reports/collections'),
        api.get('/reports/schedule'),
      ]);
      setCollections(collRes.data || null);
      setSchedule(schedRes.data || null);
    } catch (error) {
      toast.error('Failed to load cashier statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val) => `ETB ${Number(val || 0).toLocaleString()}`;

  const firstName = (user?.full_name || user?.username || user?.email || 'there').split(' ')[0];

  const recentDays = collections?.daily_trend ? collections.daily_trend.slice(-3).reverse() : [];
  const maxDay = Math.max(1, ...recentDays.map((d) => Number(d.total || 0)));
  const dueItems = schedule?.due_today?.items || [];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-800 to-blue-600 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-60 w-60 rounded-full bg-fuchsia-500/20 blur-3xl" />
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
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-cyan-100 backdrop-blur">
              <Receipt className="h-3.5 w-3.5" /> Cashier station
            </span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">Hello, {firstName}</h1>
            <p className="mt-2 max-w-md text-indigo-100/85">Process payments and manage daily collections.</p>
            <button
              onClick={fetchData}
              disabled={loading}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-indigo-950 shadow-lg shadow-cyan-400/25 transition hover:bg-cyan-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
            <p className="text-sm text-indigo-100/85">Collected today</p>
            {loading ? (
              <div className="mt-2 h-10 w-44 animate-pulse rounded-lg bg-white/20" />
            ) : (
              <p className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {formatCurrency(collections?.summary?.today?.total)}
              </p>
            )}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm">
              <span className="text-indigo-100/85">Transactions</span>
              <span className="font-bold">{loading ? '...' : collections?.summary?.today?.count || 0}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Collected today"
          value={formatCurrency(collections?.summary?.today?.total)}
          icon={CreditCard}
          tone="cyan"
          loading={loading}
          hint={`${collections?.summary?.today?.count || 0} transactions`}
        />
        <StatCard
          title="This week"
          value={formatCurrency(collections?.summary?.this_week?.total)}
          icon={Calendar}
          tone="indigo"
          loading={loading}
          hint={`${collections?.summary?.this_week?.count || 0} transactions`}
        />
        <StatCard
          title="This month"
          value={formatCurrency(collections?.summary?.this_month?.total)}
          icon={PiggyBank}
          tone="fuchsia"
          loading={loading}
          hint={`${collections?.summary?.this_month?.count || 0} transactions`}
        />
        <StatCard
          title="Due today"
          value={schedule?.due_today?.count || 0}
          icon={AlertCircle}
          tone="orange"
          loading={loading}
          hint={`${formatCurrency(schedule?.due_today?.total_amount)} expected`}
        />
      </section>

      {/* Middle grid */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Loans due today */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
            <h2 className="flex items-center gap-3 font-bold text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-md shadow-orange-500/30">
                <Calendar className="h-5 w-5" />
              </span>
              Loans due today
            </h2>
            <Link
              to="/repayments"
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-600 hover:text-white"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5 text-right">Amount due</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(4)].map((_, j) => (
                        <td key={j} className="px-5 py-5">
                          <div className="h-4 w-3/4 rounded bg-slate-200" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !dueItems.length ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Nothing due today</h3>
                      <p className="mt-1 text-sm text-slate-500">No loans due today. Great job!</p>
                    </td>
                  </tr>
                ) : (
                  dueItems.slice(0, 5).map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-indigo-50/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 font-bold text-white shadow-md">
                            {item.first_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {item.first_name} {item.last_name}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                              <Phone className="h-3 w-3" /> {item.phone || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{item.product_name}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-slate-900">
                        {formatCurrency(Number(item.total_due) - Number(item.amount_paid))}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to="/repayments"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:shadow-lg"
                        >
                          Collect <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick transactions */}
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Quick transactions</h2>
          <p className="mb-5 text-sm text-slate-500">Jump straight to a task</p>

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
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-700" />
              </Link>
            ))}
          </div>

          {/* Recent collections */}
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Recent collections</h3>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : recentDays.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-3 text-xs italic text-slate-400">No transactions recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {recentDays.map((t) => {
                  const pct = Math.round((Number(t.total || 0) / maxDay) * 100);
                  return (
                    <div key={t.date}>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">{new Date(t.date).toLocaleDateString()}</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(t.total)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-600 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}