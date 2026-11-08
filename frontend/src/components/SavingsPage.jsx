import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  X,
  History,
  User,
  PiggyBank,
  Banknote,
  Landmark,
  Smartphone,
  Loader2,
  TrendingUp,
  TrendingDown,
  Plus,
} from 'lucide-react';
import api from '../api/axios.js';
import { isValidAmount } from '../utils/validators.js';

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50 text-sm">
      <span className="text-gray-600">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >Previous</button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >Next</button>
      </div>
    </div>
  );
}

const METHODS = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'bank_transfer', label: 'Bank transfer', icon: Landmark },
  { value: 'mobile_money', label: 'Mobile money', icon: Smartphone },
];

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-emerald-700',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-700',
  'from-amber-400 to-orange-500',
  'from-rose-500 to-red-600',
  'from-teal-400 to-cyan-600',
];

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15';

export default function SavingsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  // Selected Client & Account state
  const [selectedClient, setSelectedClient] = useState(null);
  const [accountData, setAccountData] = useState(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [txPage, setTxPage] = useState(1);

  // Modal State
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState('deposit'); // 'deposit' | 'withdraw'
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ amount: '', payment_method: 'cash' });

  const loadClients = async () => {
    setLoading(true);
    try {
      // Fetch clients list to allow searching
      const { data } = await api.get('/clients', { params: { search: q, limit: 50 } });
      setClients(data.clients || []);
    } catch {
      toast.error('Failed to load clients');
    }
    setLoading(false);
  };

  useEffect(() => { loadClients(); }, []); // eslint-disable-line

  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    setTxPage(1);
    setAccountLoading(true);
    try {
      // Fetch savings account for this client
      const { data } = await api.get(`/savings/client/${client.id}`);
      setAccountData(data);
    } catch (err) {
      if (err.response?.status === 404) {
        // Client doesn't have an account yet
        setAccountData(null);
      } else {
        toast.error('Failed to load savings account');
      }
    }
    setAccountLoading(false);
  };

  const handleOpenAccount = async () => {
    setAccountLoading(true);
    try {
      await api.post('/savings/open', { client_id: selectedClient.id });
      toast.success('Savings account opened successfully');
      // Reload account data
      const { data } = await api.get(`/savings/client/${selectedClient.id}`);
      setAccountData(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to open account');
    }
    setAccountLoading(false);
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    if (!accountData?.account?.id) return;

    if (!isValidAmount(form.amount)) {
      toast.error('Amount must be a positive number with up to 2 decimal places');
      return;
    }

    setSaving(true);
    try {
      const endpoint = txType === 'deposit' ? '/savings/deposit' : '/savings/withdraw';
      await api.post(endpoint, {
        account_id: accountData.account.id,
        amount: Number(form.amount),
        payment_method: form.payment_method,
      });

      toast.success(`${txType === 'deposit' ? 'Deposit' : 'Withdrawal'} successful`);
      setShowTxModal(false);
      setForm({ amount: '', payment_method: 'cash' });

      // Refresh account details to show new balance and transaction
      const { data } = await api.get(`/savings/client/${selectedClient.id}`);
      setAccountData(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transaction failed');
    }
    setSaving(false);
  };

  const openTx = (type) => {
    setTxType(type);
    setShowTxModal(true);
  };

  const isDeposit = txType === 'deposit';
  const balance = Number(accountData?.account?.balance || 0);
  const amountNum = Number(form.amount || 0);
  const newBalance = isDeposit ? balance + amountNum : balance - amountNum;
  const overdraw = !isDeposit && amountNum > balance;

  const txs = accountData?.recent_transactions || [];
  const totalIn = txs.filter((t) => t.type === 'deposit').reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalOut = txs.filter((t) => t.type !== 'deposit').reduce((s, t) => s + Number(t.amount || 0), 0);

  return (
    <div className="flex flex-col gap-6 lg:h-[calc(100vh-8rem)] lg:flex-row">
      <style>{`
        @keyframes sav-pop { from { opacity: 0; transform: translateY(12px) scale(.97); } to { opacity: 1; transform: none; } }
        @keyframes sav-fade { from { opacity: 0; } to { opacity: 1; } }
        .sav-pop { animation: sav-pop .22s cubic-bezier(.2,.8,.2,1) both; }
        .sav-fade { animation: sav-fade .2s ease both; }
        @media (prefers-reduced-motion: reduce) { .sav-pop, .sav-fade { animation: none; } }
      `}</style>

      {/* ───────── LEFT: client list ───────── */}
      <div className="flex max-h-[28rem] w-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm lg:max-h-none lg:w-[26rem] lg:shrink-0">
        <div className="border-b border-slate-100 p-5">
          <h2 className="mb-4 flex items-center gap-3 font-bold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <User className="h-5 w-5" />
            </span>
            Select client
          </h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
              placeholder="Search clients..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadClients()}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl p-3">
                  <div className="h-11 w-11 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-2/3 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No clients found.</div>
          ) : (
            <ul className="space-y-1.5">
              {clients.map((c, idx) => {
                const active = selectedClient?.id === c.id;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => handleSelectClient(c)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        active
                          ? 'border-emerald-200 bg-emerald-50 shadow-sm'
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${
                          AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]
                        } font-bold text-white shadow-md`}
                      >
                        {c.first_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-slate-900">
                          {c.first_name} {c.last_name}
                        </div>
                        <div className="truncate text-xs text-slate-500">{c.national_id}</div>
                      </div>
                      <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        ETB {Number(c.savings_balance || 0).toLocaleString()}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ───────── RIGHT: account details ───────── */}
      <div className="flex min-h-[28rem] w-full flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
        {!selectedClient ? (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
              <PiggyBank className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No client selected</h3>
            <p className="mt-1 max-w-xs text-sm text-slate-500">
              Select a client from the list to view their savings account and recent transactions.
            </p>
          </div>
        ) : accountLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
          </div>
        ) : !accountData ? (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30">
              <Wallet className="h-10 w-10" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">No savings account</h3>
            <p className="mb-6 max-w-sm text-sm text-slate-500">
              {selectedClient.first_name} does not have an active savings account yet.
            </p>
            <button
              onClick={handleOpenAccount}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40"
            >
              <Plus className="h-4 w-4" /> Open savings account
            </button>
          </div>
        ) : (
          <>
            {/* Balance hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-600 p-6 text-white sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-400/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-100/85">Account balance</p>
                  <h2 className="mt-1 text-4xl font-extrabold tracking-tight">ETB {balance.toLocaleString()}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                      <User className="h-3.5 w-3.5" /> {selectedClient.first_name} {selectedClient.last_name}
                    </span>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                      Account #{accountData.account.id}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => openTx('deposit')}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-emerald-950 shadow-lg shadow-amber-400/25 transition hover:-translate-y-0.5 hover:bg-amber-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/50"
                  >
                    <ArrowDownCircle className="h-4 w-4" /> Deposit
                  </button>
                  <button
                    onClick={() => openTx('withdraw')}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
                  >
                    <ArrowUpCircle className="h-4 w-4" /> Withdraw
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-3 font-bold text-slate-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <History className="h-5 w-5" />
                  </span>
                  Recent transactions
                </h3>
                {txs.length > 0 && (
                  <div className="flex gap-2 text-xs font-semibold">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                      <TrendingUp className="h-3.5 w-3.5" /> In: {totalIn.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-rose-700">
                      <TrendingDown className="h-3.5 w-3.5" /> Out: {totalOut.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {txs.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <History className="h-7 w-7" />
                  </div>
                  <p className="text-sm text-slate-500">No transactions yet. Make a deposit to get started.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {txs.slice((txPage - 1) * 5, txPage * 5).map((tx) => {
                      const dep = tx.type === 'deposit';
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                                dep ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                              }`}
                            >
                              {dep ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-semibold capitalize text-slate-900">{tx.type}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(tx.created_at).toLocaleString()} &middot; by {tx.recorded_by_name || 'System'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${dep ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {dep ? '+' : '-'} ETB {Number(tx.amount).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500">Balance: {Number(tx.balance_after).toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                    <Pagination
                      page={txPage}
                      totalPages={Math.ceil(txs.length / 5) || 1}
                      onPageChange={setTxPage}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ───────── Transaction modal ───────── */}
      {showTxModal && accountData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="sav-fade absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowTxModal(false)} />
          <form
            onSubmit={handleTransaction}
            className="sav-pop relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div
              className={`flex items-center justify-between px-6 py-5 text-white ${
                isDeposit ? 'bg-gradient-to-r from-emerald-900 to-emerald-700' : 'bg-gradient-to-r from-rose-700 to-red-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  {isDeposit ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
                </span>
                <div>
                  <h3 className="text-lg font-bold">{isDeposit ? 'Deposit funds' : 'Withdraw funds'}</h3>
                  <p className="text-xs text-white/80">
                    {selectedClient.first_name} {selectedClient.last_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTxModal(false)}
                aria-label="Close"
                className="rounded-full p-2 transition hover:bg-white/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-800">Current balance</p>
                <p className="text-2xl font-extrabold text-emerald-900">ETB {balance.toLocaleString()}</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Amount (ETB) <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="1"
                  className={fieldClass}
                  placeholder="e.g. 500"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((a) => (
                    <button
                      type="button"
                      key={a}
                      onClick={() => setForm({ ...form, amount: String(a) })}
                      className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-emerald-100 hover:text-emerald-700"
                    >
                      {a.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {amountNum > 0 && (
                <div
                  className={`flex items-center justify-between rounded-2xl border p-4 text-sm ${
                    overdraw ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{overdraw ? 'Amount is higher than the balance' : 'Balance after this transaction'}</span>
                  <strong className="text-base">ETB {newBalance.toLocaleString()}</strong>
                </div>
              )}

              <div>
                <p className="mb-1.5 text-sm font-semibold text-slate-700">Payment method</p>
                <div className="grid grid-cols-3 gap-3">
                  {METHODS.map(({ value, label, icon: Icon }) => {
                    const selected = form.payment_method === value;
                    return (
                      <button
                        type="button"
                        key={value}
                        onClick={() => setForm({ ...form, payment_method: value })}
                        aria-pressed={selected}
                        className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-2 py-3.5 text-xs font-semibold transition ${
                          selected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md shadow-emerald-500/10'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50'
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            selected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowTxModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isDeposit
                    ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 shadow-emerald-900/20 focus-visible:ring-emerald-500/40'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 shadow-red-900/20 focus-visible:ring-rose-500/40'
                }`}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Processing...' : `Confirm ${isDeposit ? 'deposit' : 'withdrawal'}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}