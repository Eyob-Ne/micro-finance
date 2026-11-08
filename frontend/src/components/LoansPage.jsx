import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Check,
  X,
  Banknote,
  FileText,
  ChevronRight,
  Calculator,
  Pencil,
  Trash2,
  AlertCircle,
  ClipboardList,
  Layers,
  Loader2,
  Percent,
  CalendarClock,
  Coins,
  ShieldAlert,
} from 'lucide-react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
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

const EMPTY_PRODUCT = {
  name: '',
  interest_rate: '',
  calculation_method: 'flat',
  term_months: '',
  min_amount: '',
  max_amount: '',
  penalty_rate: 2,
  grace_period_days: 3,
};

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  approved: 'bg-sky-100 text-sky-800 ring-sky-200',
  disbursed: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  closed: 'bg-slate-100 text-slate-700 ring-slate-200',
  rejected: 'bg-rose-100 text-rose-800 ring-rose-200',
  paid: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  overdue: 'bg-rose-100 text-rose-800 ring-rose-200',
};

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Disbursed', value: 'disbursed' },
  { label: 'Closed', value: 'closed' },
  { label: 'Rejected', value: 'rejected' },
];

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15';

function Field({ label, required, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function ModalHeader({ icon: Icon, title, subtitle, onClose }) {
  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-emerald-900 to-emerald-700 px-6 py-5 text-white">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-emerald-950">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          {subtitle && <p className="text-xs text-emerald-100/80">{subtitle}</p>}
        </div>
      </div>
      <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 transition hover:bg-white/15">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function SubmitButton({ saving, children }) {
  return (
    <button
      disabled={saving}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export default function LoansPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applications');

  // Data State
  const [loans, setLoans] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [viewLoan, setViewLoan] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmProductDel, setConfirmProductDel] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [loanForm, setLoanForm] = useState({ client_id: '', product_id: '', principal: '' });
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);

  const loadData = async (term = q) => {
    setLoading(true);
    try {
      const [loansRes, productsRes, clientsRes] = await Promise.all([
        api.get('/loans', { params: { status: term } }),
        api.get('/loans/products'),
        api.get('/clients', { params: { limit: 100 } }),
      ]);
      setLoans(loansRes.data.loans || []);
      setProducts(productsRes.data.products || []);
      setClients(clientsRes.data.clients || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load loan data');
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [activeTab]); // eslint-disable-line

  const applyFilter = (value) => {
    setQ(value);
    setPage(1);
    loadData(value);
  };

  // --- LOAN ACTIONS ---
  const handleCreateLoan = async (e) => {
    e.preventDefault();

    if (!loanForm.client_id) {
      toast.error('Please choose a client');
      return;
    }

    if (!loanForm.product_id) {
      toast.error('Please choose a loan product');
      return;
    }

    if (!isValidAmount(loanForm.principal)) {
      toast.error('Amount must be a positive number with up to 2 decimal places');
      return;
    }

    const selProd = products.find((p) => String(p.id) === String(loanForm.product_id));
    if (selProd) {
      const pNum = Number(loanForm.principal);
      const min = Number(selProd.min_amount);
      const max = Number(selProd.max_amount);
      if (pNum < min || pNum > max) {
        toast.error(`Amount must be between ${min} and ${max} ETB`);
        return;
      }
    }

    setSaving(true);
    try {
      await api.post('/loans/apply', loanForm);
      toast.success('Loan application submitted successfully');
      setShowLoanForm(false);
      setLoanForm({ client_id: '', product_id: '', principal: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create loan');
    }
    setSaving(false);
  };

  const handleLoanAction = async (id, action) => {
    try {
      await api.put(`/loans/${id}/${action}`);
      toast.success(`Loan ${action}d successfully`);
      loadData();
      if (viewLoan && viewLoan.loan.id === id) setViewLoan(null);
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} loan`);
    }
  };

  const openLoanDetails = async (id) => {
    try {
      const { data } = await api.get(`/loans/${id}`);
      setViewLoan(data);
    } catch (err) {
      toast.error('Failed to load loan details');
    }
  };

  // --- PRODUCT ACTIONS ---
  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setShowProductForm(true);
  };

  const openEditProduct = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name || '',
      interest_rate: p.interest_rate || '',
      calculation_method: p.calculation_method || 'flat',
      term_months: p.term_months || '',
      min_amount: p.min_amount || '',
      max_amount: p.max_amount || '',
      penalty_rate: p.penalty_rate || 2,
      grace_period_days: p.grace_period_days || 3,
    });
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    const rate = Number(productForm.interest_rate);
    if (isNaN(rate) || rate <= 0 || rate > 100) {
      toast.error('Interest rate must be between 0 and 100');
      return;
    }

    const term = Number(productForm.term_months);
    if (!Number.isInteger(term) || term < 1 || term > 120) {
      toast.error('Term must be between 1 and 120 months');
      return;
    }

    if (!isValidAmount(productForm.min_amount) || !isValidAmount(productForm.max_amount)) {
      toast.error('Amount must be a positive number with up to 2 decimal places');
      return;
    }

    if (Number(productForm.min_amount) > Number(productForm.max_amount)) {
      toast.error('min_amount cannot be greater than max_amount.');
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        await api.put(`/loans/products/${editingProduct.id}`, productForm);
        toast.success('Product updated successfully');
      } else {
        await api.post('/loans/products', productForm);
        toast.success('Product created successfully');
      }
      setShowProductForm(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    }
    setSaving(false);
  };

  const handleDeleteProduct = async () => {
    setSaving(true);
    try {
      await api.delete(`/loans/products/${confirmProductDel.id}`);
      toast.success('Product deactivated successfully');
      setConfirmProductDel(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deactivate product');
    }
    setSaving(false);
  };

  const getStatusBadge = (status) => (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
        STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 ring-slate-200'
      }`}
    >
      {status}
    </span>
  );

  const isAdmin = user?.role === 'admin';
  const canReview = user?.role === 'admin' || user?.role === 'manager';
  const canDisburse = user?.role === 'admin' || user?.role === 'cashier';

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes loans-pop { from { opacity: 0; transform: translateY(12px) scale(.97); } to { opacity: 1; transform: none; } }
        @keyframes loans-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes loans-slide { from { transform: translateX(100%); } to { transform: none; } }
        .loans-pop { animation: loans-pop .22s cubic-bezier(.2,.8,.2,1) both; }
        .loans-fade { animation: loans-fade .2s ease both; }
        .loans-slide { animation: loans-slide .3s cubic-bezier(.2,.8,.2,1) both; }
        @media (prefers-reduced-motion: reduce) { .loans-pop, .loans-fade, .loans-slide { animation: none; } }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Loan management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage loan products, applications, and disbursements.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'applications' ? (
            <button
              onClick={() => setShowLoanForm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 active:translate-y-0"
            >
              <Plus className="h-4 w-4" /> New application
            </button>
          ) : (
            isAdmin && (
              <button
                onClick={openCreateProduct}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 active:translate-y-0"
              >
                <Plus className="h-4 w-4" /> New product
              </button>
            )
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex gap-1 rounded-2xl bg-slate-200/70 p-1.5">
        <button
          onClick={() => setActiveTab('applications')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'applications' ? 'bg-white text-emerald-800 shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardList className="h-4 w-4" /> Loan applications
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('products')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'products' ? 'bg-white text-emerald-800 shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-4 w-4" /> Loan products
          </button>
        )}
      </div>

      {/* ───────── TAB 1: APPLICATIONS ───────── */}
      {activeTab === 'applications' && (
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
          <div className="space-y-4 border-b border-slate-100 p-4 sm:p-5">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-12 pr-4 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
                placeholder="Search by status (e.g. pending)..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => applyFilter(f.value)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    q === f.value
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4 text-right">Principal</th>
                  <th className="px-6 py-4 text-right">Total repay</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
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
                ) : loans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <ClipboardList className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">No loans found</h3>
                      <p className="mt-1 text-sm text-slate-500">Try another status or create a new application.</p>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const totalPages = Math.ceil(loans.length / 10) || 1;
                    const paginatedLoans = loans.slice((page - 1) * 10, page * 10);
                    return paginatedLoans.map((loan) => (
                      <tr
                        key={loan.id}
                        className="group cursor-pointer transition-colors hover:bg-emerald-50/40"
                        onClick={() => navigate(`/loans/${loan.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 font-bold text-white shadow-md">
                              {loan.first_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">
                                {loan.first_name} {loan.last_name}
                              </div>
                              <div className="text-xs text-slate-500">{loan.national_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{loan.product_name}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-slate-900">
                          ETB {Number(loan.principal).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-slate-500">
                          ETB {Number(loan.total_repayable).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">{getStatusBadge(loan.status)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {loan.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              {canReview ? (
                                <>
                                  <button
                                    onClick={() => handleLoanAction(loan.id, 'approve')}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                                    title="Approve"
                                  >
                                    <Check className="h-4 w-4" /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleLoanAction(loan.id, 'reject')}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-600 hover:text-white"
                                    title="Reject"
                                  >
                                    <X className="h-4 w-4" /> Reject
                                  </button>
                                </>
                              ) : (
                                <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">Awaiting review</span>
                              )}
                            </div>
                          )}
                          {loan.status === 'approved' &&
                            (canDisburse ? (
                              <button
                                onClick={() => handleLoanAction(loan.id, 'disburse')}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-700 to-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-900/20 transition hover:shadow-lg"
                              >
                                <Banknote className="h-4 w-4" /> Disburse
                              </button>
                            ) : (
                              <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">Awaiting cashier</span>
                            ))}
                          {['disbursed', 'closed', 'rejected'].includes(loan.status) && (
                            <button
                              onClick={() => navigate(`/loans/${loan.id}`)}
                              aria-label="View details"
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-emerald-700"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          )}
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
            totalPages={Math.ceil(loans.length / 10) || 1}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* ───────── TAB 2: PRODUCTS ───────── */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-50 transition duration-300 group-hover:scale-125" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/30">
                    <Calculator className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{p.name}</h3>
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-amber-800">
                      {p.calculation_method} interest
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 transition lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                  <button
                    onClick={() => openEditProduct(p)}
                    className="rounded-xl bg-emerald-50 p-2 text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                    title="Edit"
                    aria-label="Edit product"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmProductDel(p)}
                    className="rounded-xl bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-600 hover:text-white"
                    title="Deactivate"
                    aria-label="Deactivate product"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="relative mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-sky-50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-sky-700">
                    <Percent className="h-3.5 w-3.5" /> Interest
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{p.interest_rate}%</p>
                </div>
                <div className="rounded-2xl bg-violet-50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
                    <CalendarClock className="h-3.5 w-3.5" /> Term
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{p.term_months} months</p>
                </div>
              </div>

              <div className="relative mt-4 space-y-2.5 text-sm">
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Coins className="h-4 w-4" /> Amount range
                  </span>
                  <span className="font-semibold text-slate-800">
                    {Number(p.min_amount).toLocaleString()} - {Number(p.max_amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <ShieldAlert className="h-4 w-4" /> Penalty
                  </span>
                  <span className="font-semibold text-slate-800">
                    {p.penalty_rate}% / {p.grace_period_days} days
                  </span>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="col-span-full rounded-3xl border-2 border-dashed border-slate-200 bg-white p-14 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Calculator className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No products yet</h3>
              <p className="mb-5 mt-1 text-sm text-slate-500">Create your first loan product to start offering loans.</p>
              <button
                onClick={openCreateProduct}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" /> Create product
              </button>
            </div>
          )}
        </div>
      )}

      {/* ───────── MODALS ───────── */}

      {/* 1. New loan application */}
      {showLoanForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="loans-fade absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowLoanForm(false)} />
          <form
            onSubmit={handleCreateLoan}
            className="loans-pop relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <ModalHeader
              icon={ClipboardList}
              title="New loan application"
              subtitle="Fields marked * are required"
              onClose={() => setShowLoanForm(false)}
            />
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <Field label="Select client" required>
                <select
                  required
                  className={fieldClass}
                  value={loanForm.client_id}
                  onChange={(e) => setLoanForm({ ...loanForm, client_id: e.target.value })}
                >
                  <option value="">-- Choose client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.national_id})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Loan product" required>
                <select
                  required
                  className={fieldClass}
                  value={loanForm.product_id}
                  onChange={(e) => setLoanForm({ ...loanForm, product_id: e.target.value })}
                >
                  <option value="">-- Choose product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.interest_rate}% {p.calculation_method})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Principal amount (ETB)" required>
                <input
                  required
                  type="number"
                  min="1"
                  className={fieldClass}
                  placeholder="e.g. 5000"
                  value={loanForm.principal}
                  onChange={(e) => setLoanForm({ ...loanForm, principal: e.target.value })}
                />
                {(() => {
                  const sel = products.find((p) => String(p.id) === String(loanForm.product_id));
                  return sel ? (
                    <p className="mt-1.5 text-xs font-medium text-slate-500">
                      Product limit: ETB {Number(sel.min_amount).toLocaleString()} &ndash; ETB {Number(sel.max_amount).toLocaleString()}
                    </p>
                  ) : null;
                })()}
              </Field>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowLoanForm(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <SubmitButton saving={saving}>{saving ? 'Submitting...' : 'Submit application'}</SubmitButton>
            </div>
          </form>
        </div>
      )}

      {/* 2. Create / edit product */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="loans-fade absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowProductForm(false)} />
          <form
            onSubmit={handleSaveProduct}
            className="loans-pop relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <ModalHeader
              icon={Calculator}
              title={editingProduct ? 'Edit loan product' : 'Create loan product'}
              subtitle="Fields marked * are required"
              onClose={() => setShowProductForm(false)}
            />
            <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2">
              <Field label="Product name" required className="sm:col-span-2">
                <input
                  required
                  className={fieldClass}
                  placeholder="e.g. Small Business Loan"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </Field>
              <Field label="Interest rate (%)" required>
                <input
                  required
                  type="number"
                  step="0.1"
                  className={fieldClass}
                  value={productForm.interest_rate}
                  onChange={(e) => setProductForm({ ...productForm, interest_rate: e.target.value })}
                />
              </Field>
              <Field label="Calculation method">
                <select
                  className={fieldClass}
                  value={productForm.calculation_method}
                  onChange={(e) => setProductForm({ ...productForm, calculation_method: e.target.value })}
                >
                  <option value="flat">Flat rate</option>
                  <option value="declining">Declining balance</option>
                </select>
              </Field>
              <Field label="Term (months)" required>
                <input
                  required
                  type="number"
                  className={fieldClass}
                  value={productForm.term_months}
                  onChange={(e) => setProductForm({ ...productForm, term_months: e.target.value })}
                />
              </Field>
              <Field label="Penalty rate (%)">
                <input
                  type="number"
                  step="0.1"
                  className={fieldClass}
                  value={productForm.penalty_rate}
                  onChange={(e) => setProductForm({ ...productForm, penalty_rate: e.target.value })}
                />
              </Field>
              <Field label="Min amount (ETB)" required>
                <input
                  required
                  type="number"
                  className={fieldClass}
                  value={productForm.min_amount}
                  onChange={(e) => setProductForm({ ...productForm, min_amount: e.target.value })}
                />
              </Field>
              <Field label="Max amount (ETB)" required>
                <input
                  required
                  type="number"
                  className={fieldClass}
                  value={productForm.max_amount}
                  onChange={(e) => setProductForm({ ...productForm, max_amount: e.target.value })}
                />
              </Field>
              <Field label="Grace period (days)">
                <input
                  type="number"
                  className={fieldClass}
                  value={productForm.grace_period_days}
                  onChange={(e) => setProductForm({ ...productForm, grace_period_days: e.target.value })}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowProductForm(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <SubmitButton saving={saving}>
                {saving ? 'Saving...' : editingProduct ? 'Save changes' : 'Create product'}
              </SubmitButton>
            </div>
          </form>
        </div>
      )}

      {/* 3. Deactivate product */}
      {confirmProductDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="loans-fade absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setConfirmProductDel(null)} />
          <div className="loans-pop relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-red-500/30">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Deactivate product</h3>
            <p className="mb-6 mt-2 text-sm text-slate-500">
              Are you sure you want to deactivate <strong className="text-slate-800">{confirmProductDel.name}</strong>?
              Existing loans using this product will not be affected, but you will no longer be able to create new loans
              under it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmProductDel(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Loan details drawer */}
      {viewLoan && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="loans-fade absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setViewLoan(null)} />
          <div className="loans-slide relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-900 to-emerald-700 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-400 font-bold text-emerald-950">
                  {viewLoan.loan.first_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-bold">Loan #{viewLoan.loan.id}</h3>
                  <p className="text-sm text-emerald-100/80">
                    {viewLoan.loan.first_name} {viewLoan.loan.last_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewLoan(null)}
                aria-label="Close details"
                className="rounded-full p-2 transition hover:bg-white/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-sky-50 p-4">
                  <p className="text-xs font-semibold text-sky-700">Principal</p>
                  <p className="mt-1 font-bold text-slate-900">ETB {Number(viewLoan.loan.principal).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-semibold text-emerald-700">Total repayable</p>
                  <p className="mt-1 font-bold text-slate-900">
                    ETB {Number(viewLoan.loan.total_repayable).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-600">Status</p>
                  <div className="mt-1.5">{getStatusBadge(viewLoan.loan.status)}</div>
                </div>
              </div>

              {viewLoan.loan.status === 'pending' && canReview && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleLoanAction(viewLoan.loan.id, 'approve')}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleLoanAction(viewLoan.loan.id, 'reject')}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-600 hover:text-white"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}

              <div>
                <h4 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <FileText className="h-4 w-4" />
                  </span>
                  Repayment schedule
                </h4>
                <div className="overflow-hidden rounded-2xl border border-slate-200/70">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Due date</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewLoan.schedules.map((s) => (
                        <tr key={s.id} className="transition-colors hover:bg-emerald-50/40">
                          <td className="px-4 py-3 font-semibold text-slate-700">{s.installment_no}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(s.due_date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {Number(s.total_due).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">{getStatusBadge(s.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}