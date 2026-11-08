import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, X, AlertTriangle, ArrowRight, CheckCircle2, RefreshCw,
  Banknote, Landmark, Smartphone, Phone, CreditCard, Coins, Gavel,
  Loader2, Wallet, Search, User, FileText, ChevronRight, MessageSquare,
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

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15';

export default function RepaymentsPage() {
  // Data State
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Modal State
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applyingPenalties, setApplyingPenalties] = useState(false);
  const [confirmPenalties, setConfirmPenalties] = useState(false);

  // Client Search State (NEW)
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientLoans, setClientLoans] = useState([]);
  const [loansLoading, setLoansLoading] = useState(false);
  const searchDebounce = useRef(null);

  // Form State
  const [form, setForm] = useState({
    loan_id: '',
    amount: '',
    payment_method: 'cash',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/repayments/overdue');
      setOverdueLoans(data.overdue_loans || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load overdue loans');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ─── Client search debounced ───────────────────────────
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!clientSearch || clientSearch.length < 2) {
      setClientResults([]);
      return;
    }
    setSearching(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/clients', {
          params: { search: clientSearch, limit: 5 },
        });
        setClientResults(data.clients || []);
      } catch {
        setClientResults([]);
      }
      setSearching(false);
    }, 400);
    return () => clearTimeout(searchDebounce.current);
  }, [clientSearch]);

  // ─── Load a client's active loans ───────────────────────
  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    setClientResults([]);
    setClientSearch('');
    setLoansLoading(true);
    try {
      const { data } = await api.get(`/clients/${client.id}`);
      // Only loans with status 'disbursed' can receive repayments
      const active = (data.active_loans || []).filter(
        (l) => l.status === 'disbursed'
      );
      setClientLoans(active);
    } catch {
      toast.error('Failed to load client loans');
      setClientLoans([]);
    }
    setLoansLoading(false);
  };

  // ─── Open payment form for a specific loan ──────────────
  const openPaymentForLoan = (loanId) => {
    setForm({ loan_id: String(loanId), amount: '', payment_method: 'cash' });
    setShowForm(true);
  };

  const resetAll = () => {
    setSelectedClient(null);
    setClientLoans([]);
    setClientSearch('');
    setClientResults([]);
    setForm({ loan_id: '', amount: '', payment_method: 'cash' });
  };
  const handleRecordRepayment = async (e) => {
    e.preventDefault();

    // ─── Strict validation ───
    if (!form.loan_id || !form.loan_id.toString().trim()) {
      toast.error('Please select a loan first');
      return;
    }

    const loanIdNum = Number(form.loan_id);
    const amountNum = Number(form.amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (!isValidAmount(form.amount)) {
      toast.error('Amount must have at most 2 decimal places');
      return;
    }

    // ─── Build a clean payload (send parsed number if numeric, else string) ───
    const payload = {
      loan_id: isNaN(loanIdNum) ? form.loan_id : loanIdNum,
      amount: amountNum,
      payment_method: form.payment_method,
    };

    // Sanity check before sending
    console.log('[DMMS] Sending repayment:', payload);

    setSaving(true);
    try {
      const { data } = await api.post('/repayments', payload);
      toast.success(data.message || 'Repayment recorded successfully');
      setShowForm(false);
      resetAll();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record repayment');
    }
    setSaving(false);
  };

  const handleApplyPenalties = async () => {
    setConfirmPenalties(false);
    setApplyingPenalties(true);
    try {
      const { data } = await api.post('/repayments/apply-penalties');
      toast.success(data.message || 'Penalties applied');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply penalties');
    }
    setApplyingPenalties(false);
  };

  const handleContact = (item) => {
    const phone = item.phone;
    if (!phone) {
      toast.error('No phone number on record');
      return;
    }
    const firstName = item.first_name || 'Client';
    window.location.href = `sms:${phone}?body=Dear ${firstName}, your loan is overdue. Please contact us.`;
  };

  const totalOverdue = overdueLoans.reduce((s, l) => s + Number(l.total_overdue_amount || 0), 0);
  const totalPenalty = overdueLoans.reduce((s, l) => s + Number(l.total_penalty_accrued || 0), 0);

  const summary = [
    { label: 'Loans past due', value: overdueLoans.length.toLocaleString(), icon: AlertTriangle, tile: 'from-rose-500 to-red-600', glow: 'shadow-red-500/30' },
    { label: 'Total overdue', value: `ETB ${totalOverdue.toLocaleString()}`, icon: Coins, tile: 'from-amber-400 to-orange-500', glow: 'shadow-orange-500/30' },
    { label: 'Penalties accrued', value: `ETB ${totalPenalty.toLocaleString()}`, icon: Gavel, tile: 'from-violet-500 to-purple-700', glow: 'shadow-purple-500/30' },
  ];

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes rep-pop { from { opacity: 0; transform: translateY(12px) scale(.97); } to { opacity: 1; transform: none; } }
        @keyframes rep-fade { from { opacity: 0; } to { opacity: 1; } }
        .rep-pop { animation: rep-pop .22s cubic-bezier(.2,.8,.2,1) both; }
        .rep-fade { animation: rep-fade .2s ease both; }
        @media (prefers-reduced-motion: reduce) { .rep-pop, .rep-fade { animation: none; } }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Collections</h1>
          <p className="mt-1 text-sm text-slate-500">Record payments and monitor overdue loans.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setConfirmPenalties(true)}
            disabled={applyingPenalties}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-500 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${applyingPenalties ? 'animate-spin' : ''}`} />
            {applyingPenalties ? 'Applying...' : 'Apply penalties'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 active:translate-y-0"
          >
            <Plus className="h-4 w-4" /> Record payment
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summary.map(({ label, value, icon: Icon, tile, glow }) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tile} text-white shadow-lg ${glow}`}>
              <Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              {loading ? (
                <div className="mt-1 h-6 w-24 animate-pulse rounded bg-slate-200" />
              ) : (
                <p className="truncate text-xl font-bold text-slate-900">{value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Overdue loans table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h3 className="flex items-center gap-3 font-bold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            Overdue loans
          </h3>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            {overdueLoans.length} past due
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4 text-center">Installments</th>
                <th className="px-6 py-4 text-right">Overdue amount</th>
                <th className="px-6 py-4 text-right">Penalty</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-5">
                        <div className="h-4 w-3/4 rounded bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : overdueLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">All caught up</h3>
                    <p className="mt-1 text-sm text-slate-500">There are no overdue loans at the moment.</p>
                  </td>
                </tr>
              ) : (
                (() => {
                  const paginated = overdueLoans.slice((page - 1) * 10, page * 10);
                  return paginated.map((loan) => (
                    <tr key={loan.loan_id} className="group transition-colors hover:bg-rose-50/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 font-bold text-white shadow-md">
                            {loan.first_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {loan.first_name} {loan.last_name}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {loan.phone || 'N/A'}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <CreditCard className="h-3 w-3" /> {loan.national_id || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{loan.product_name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                          {loan.overdue_installments_count}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-rose-600">
                        ETB {Number(loan.total_overdue_amount).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-slate-500">
                        ETB {Number(loan.total_penalty_accrued).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleContact(loan)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
                            title="Send SMS"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Contact
                          </button>
                          <button
                            onClick={() => openPaymentForLoan(loan.loan_id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                          >
                            Pay now <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={Math.ceil(overdueLoans.length / 10) || 1}
          onPageChange={setPage}
        />
      </div>

      {/* ───────── RECORD PAYMENT MODAL (Redesigned) ───────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="rep-fade absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <form
            onSubmit={handleRecordRepayment}
            className="rep-pop relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-900 to-emerald-700 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-emerald-950">
                  <Wallet className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold">Record payment</h3>
                  <p className="text-xs text-emerald-100/80">Search a client to find their loans</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetAll(); }}
                aria-label="Close"
                className="rounded-full p-2 transition hover:bg-white/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {/* STEP 1: Client search OR selected client */}
              {!selectedClient ? (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Find client <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      autoFocus
                      className={`${fieldClass} pl-10`}
                      placeholder="Search by name, phone, or national ID..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                    )}
                  </div>

                  {clientResults.length > 0 && (
                    <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {clientResults.map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => handleSelectClient(c)}
                          className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-emerald-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                              {c.first_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {c.first_name} {c.last_name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {c.phone} • {c.national_id}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  )}

                  {clientSearch.length >= 2 && !searching && clientResults.length === 0 && (
                    <p className="mt-2 text-xs text-slate-500">No clients found.</p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                        {selectedClient.first_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {selectedClient.first_name} {selectedClient.last_name}
                        </p>
                        <p className="text-xs text-slate-600">
                          {selectedClient.phone} • {selectedClient.national_id}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={resetAll}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Change client
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Show loans of the selected client */}
              {selectedClient && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Select a loan <span className="text-rose-500">*</span>
                  </p>
                  {loansLoading ? (
                    <div className="flex items-center justify-center rounded-xl border border-slate-200 py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                  ) : clientLoans.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center">
                      <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      <p className="text-sm text-slate-500">No active loans for this client.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientLoans.map((loan) => {
                        const isSelected = String(form.loan_id) === String(loan.id);
                        return (
                          <button
                            type="button"
                            key={loan.id}
                            onClick={() => setForm((prev) => ({ ...prev, loan_id: String(loan.id) }))}
                            className={`flex w-full items-center justify-between rounded-xl border-2 p-3.5 text-left transition ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10'
                                : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{loan.product_name}</p>
                                <p className="text-xs text-slate-500">
                                  Loan #{loan.id} • {loan.status}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Total repayable</p>
                              <p className="font-bold text-slate-900">
                                ETB {Number(loan.total_repayable).toLocaleString()}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Amount + Method */}
              {form.loan_id && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Amount (ETB) <span className="text-rose-500">*</span>
                    </label>
                    <input
  required
  autoFocus
  type="number"
  step="0.01"
  min="0.01"
  className={fieldClass}
  placeholder="e.g. 500"
  value={form.amount}
  onChange={(e) => setForm({ ...form, amount: e.target.value })}
/>
                  </div>

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
                            className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-2 py-3.5 text-xs font-semibold transition ${
                              selected
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md shadow-emerald-500/10'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50'
                            }`}
                          >
                            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              selected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <Icon className="h-5 w-5" />
                            </span>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetAll(); }}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                disabled={saving || !form.loan_id || !form.amount}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Processing...' : 'Submit payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ───────── Apply penalties confirmation ───────── */}
      {confirmPenalties && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="rep-fade absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setConfirmPenalties(false)} />
          <div className="rep-pop relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30">
              <Gavel className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Run the penalty engine?</h3>
            <p className="mb-6 mt-2 text-sm text-slate-500">
              This will calculate and apply penalties to all overdue schedules.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmPenalties(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyPenalties}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-500/25 transition hover:bg-amber-600"
              >
                Apply penalties
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}