import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ArrowRight,
  ArrowUpRight,
  Menu,
  X,
  Users,
  Wallet,
  CreditCard,
  PiggyBank,
  FileBarChart,
  ShieldCheck,
  Check,
  CheckCircle2,
  Calculator,
  UserCog,
  LineChart,
  Banknote,
  FilePlus2,
  IdCard,
  Clock,
  Sparkles,
} from 'lucide-react';

/* ───────────────────────── Content ───────────────────────── */

const NAV = [
  { id: 'features', label: 'Features' },
  { id: 'calculator', label: 'Loan calculator' },
  { id: 'how', label: 'How it works' },
  { id: 'roles', label: 'Teams' },
];

const TICKER = [
  'Client records',
  'KYC documents',
  'Loan products',
  'Approvals',
  'Disbursements',
  'Repayments',
  'Penalties',
  'Savings accounts',
  'Live reports',
  'Staff roles',
];

const STEPS = [
  {
    title: 'Register the client',
    text: 'Capture personal details and upload ID and photo once. Everything stays on the client record.',
    tag: 'Loan officer',
  },
  {
    title: 'Create the application',
    text: 'Choose a loan product and amount. The repayment schedule is generated automatically.',
    tag: 'Loan officer',
  },
  {
    title: 'Approve and disburse',
    text: 'Managers approve or reject. Cashiers release the money. Each step is recorded.',
    tag: 'Manager and cashier',
  },
  {
    title: 'Collect and review',
    text: 'Take repayments, apply penalties on overdue schedules and read the reports.',
    tag: 'Everyone',
  },
];

const TEAMS = [
  {
    name: 'Administrator',
    icon: UserCog,
    line: 'Sets up the system and sees all of it.',
    points: ['Staff accounts and roles', 'Loan products', 'Every module and report'],
    bg: 'bg-emerald-900',
    chip: 'bg-emerald-400 text-emerald-950',
    glow: 'bg-emerald-400/30',
  },
  {
    name: 'Manager',
    icon: LineChart,
    line: 'Keeps the portfolio healthy.',
    points: ['Approve or reject loans', 'Portfolio and collections', 'Staff performance'],
    bg: 'bg-violet-900',
    chip: 'bg-fuchsia-300 text-violet-950',
    glow: 'bg-fuchsia-400/30',
  },
  {
    name: 'Cashier',
    icon: Banknote,
    line: 'Fast and accurate at the counter.',
    points: ['Record repayments', 'Savings deposits and withdrawals', 'Loans due today'],
    bg: 'bg-indigo-900',
    chip: 'bg-cyan-300 text-indigo-950',
    glow: 'bg-cyan-400/30',
  },
  {
    name: 'Loan officer',
    icon: FilePlus2,
    line: 'Brings in clients and builds applications.',
    points: ['Register clients with KYC', 'Create loan applications', 'Track approvals'],
    bg: 'bg-orange-700',
    chip: 'bg-amber-200 text-orange-950',
    glow: 'bg-yellow-300/40',
  },
];

const BARS = [34, 48, 41, 62, 55, 78, 92];

/* ───────────────────────── Helpers ───────────────────────── */

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`lp-reveal ${shown ? 'lp-in' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

function money(n) {
  return `ETB ${Math.round(n).toLocaleString()}`;
}

/* ───────────────────────── Loan calculator ───────────────────────── */

function LoanCalculator() {
  const [amount, setAmount] = useState(50000);
  const [months, setMonths] = useState(12);
  const [rate, setRate] = useState(15);
  const [method, setMethod] = useState('flat');

  const result = useMemo(() => {
    const P = amount;
    const n = months;
    if (method === 'flat') {
      const interest = P * (rate / 100) * (n / 12);
      const total = P + interest;
      return { monthly: total / n, interest, total };
    }
    const r = rate / 1200;
    const monthly = r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n));
    const total = monthly * n;
    return { monthly, interest: total - P, total };
  }, [amount, months, rate, method]);

  const principalShare = Math.round((amount / result.total) * 100);

  const sliders = [
    { label: 'Loan amount', value: money(amount), min: 5000, max: 500000, step: 1000, val: amount, set: setAmount, lo: 'ETB 5k', hi: 'ETB 500k' },
    { label: 'Term', value: `${months} months`, min: 3, max: 36, step: 1, val: months, set: setMonths, lo: '3 mo', hi: '36 mo' },
    { label: 'Yearly interest rate', value: `${rate}%`, min: 1, max: 40, step: 0.5, val: rate, set: setRate, lo: '1%', hi: '40%' },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* controls */}
      <div className="rounded-[2rem] bg-white/5 p-6 ring-1 ring-white/15 backdrop-blur sm:p-8 lg:col-span-3">
        <div className="mb-8 inline-flex rounded-full bg-white/10 p-1">
          {[
            { v: 'flat', label: 'Flat rate' },
            { v: 'declining', label: 'Declining balance' },
          ].map((m) => (
            <button
              key={m.v}
              onClick={() => setMethod(m.v)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                method === m.v ? 'bg-[#F5C84B] text-[#0B2B20]' : 'text-white/70 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="space-y-8">
          {sliders.map((s) => (
            <div key={s.label}>
              <div className="mb-3 flex items-end justify-between">
                <label className="text-sm font-semibold text-white/70">{s.label}</label>
                <span className="font-display text-2xl font-semibold text-white">{s.value}</span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={s.val}
                onChange={(e) => s.set(Number(e.target.value))}
                aria-label={s.label}
                className="lp-range h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 outline-none"
              />
              <div className="mt-2 flex justify-between text-xs text-white/40">
                <span>{s.lo}</span>
                <span>{s.hi}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* result */}
      <div className="flex flex-col justify-between rounded-[2rem] bg-[#F5C84B] p-6 text-[#0B2B20] sm:p-8 lg:col-span-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#0B2B20]/60">You would pay</p>
          <p className="font-display mt-2 text-5xl font-semibold leading-none sm:text-6xl">{money(result.monthly)}</p>
          <p className="mt-1 text-sm font-semibold text-[#0B2B20]/70">per month</p>

          <div className="mt-8">
            <div className="flex h-3 overflow-hidden rounded-full bg-[#0B2B20]/15">
              <div className="bg-[#0B2B20] transition-all duration-500" style={{ width: `${principalShare}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs font-semibold text-[#0B2B20]/70">
              <span>Principal {principalShare}%</span>
              <span>Interest {100 - principalShare}%</span>
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between border-t border-[#0B2B20]/15 pt-3">
              <dt className="font-medium text-[#0B2B20]/70">Total interest</dt>
              <dd className="font-bold">{money(result.interest)}</dd>
            </div>
            <div className="flex justify-between border-t border-[#0B2B20]/15 pt-3">
              <dt className="font-medium text-[#0B2B20]/70">Total repayable</dt>
              <dd className="font-bold">{money(result.total)}</dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-[#0B2B20]/60">
          Illustration only. Real terms depend on the loan product your institution sets up.
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="lp-root min-h-screen overflow-x-hidden bg-[#FBF8F1] text-[#0B2B20]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap');
        .lp-root { font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif; }
        .lp-root .font-display { font-family: 'Fraunces', Georgia, serif; letter-spacing: -0.02em; }
        @keyframes lp-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes lp-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes lp-bob { 0%,100% { transform: translateY(0) rotate(var(--r,0deg)); } 50% { transform: translateY(-10px) rotate(var(--r,0deg)); } }
        @keyframes lp-rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
        .lp-marquee { animation: lp-marquee 32s linear infinite; }
        .lp-bar { transform-origin: bottom; animation: lp-grow .9s cubic-bezier(.2,.8,.2,1) both; }
        .lp-bob { transform: rotate(var(--r,0deg)); animation: lp-bob 7s ease-in-out infinite; }
        .lp-bob-2 { transform: rotate(var(--r,0deg)); animation: lp-bob 9s ease-in-out infinite reverse; }
        .lp-hero-in { animation: lp-rise .8s cubic-bezier(.2,.8,.2,1) both; }
        .lp-reveal { opacity: 0; transform: translateY(26px); transition: opacity .7s ease, transform .7s cubic-bezier(.2,.8,.2,1); }
        .lp-reveal.lp-in { opacity: 1; transform: none; }
        .lp-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 26px; height: 26px; border-radius: 9999px; background: #F5C84B; border: 4px solid #0B2B20; box-shadow: 0 4px 14px rgba(0,0,0,.35); cursor: grab; }
        .lp-range::-moz-range-thumb { width: 22px; height: 22px; border-radius: 9999px; background: #F5C84B; border: 4px solid #0B2B20; box-shadow: 0 4px 14px rgba(0,0,0,.35); cursor: grab; }
        .lp-range:focus-visible { box-shadow: 0 0 0 4px rgba(245,200,75,.35); }
        @media (prefers-reduced-motion: reduce) {
          .lp-marquee, .lp-bar, .lp-bob, .lp-bob-2, .lp-hero-in { animation: none; }
          .lp-reveal { opacity: 1; transform: none; transition: none; }
        }
      `}</style>

      {/* ───────── Floating nav ───────── */}
      <header className="fixed inset-x-0 top-4 z-50 px-4">
        <div className="mx-auto max-w-5xl rounded-full border border-[#0B2B20]/10 bg-[#FBF8F1]/85 shadow-lg shadow-[#0B2B20]/5 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between pl-4 pr-2 sm:pl-5">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B2B20]">
                <Building2 className="h-4 w-4 text-[#F5C84B]" />
              </span>
              <span className="font-display text-xl font-bold">DMMS</span>
            </button>

            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => go(n.id)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[#0B2B20]/70 transition hover:bg-[#0B2B20]/5 hover:text-[#0B2B20]"
                >
                  {n.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#0B2B20] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0F3D2D]"
              >
                Sign in <ArrowUpRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                className="rounded-full p-2.5 text-[#0B2B20] transition hover:bg-[#0B2B20]/5 md:hidden"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="space-y-1 border-t border-[#0B2B20]/10 p-3 md:hidden">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => go(n.id)}
                  className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold hover:bg-[#0B2B20]/5"
                >
                  {n.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="relative px-5 pb-20 pt-36 sm:px-8 sm:pt-44">
        <div className="pointer-events-none absolute left-1/2 top-24 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[#F5C84B]/25 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="lp-hero-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#0B2B20] px-4 py-1.5 text-xs font-bold text-[#F5C84B]">
              <Sparkles className="h-3.5 w-3.5" /> Digital Microfinance Management System
            </span>

            <h1 className="font-display mt-7 text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
              Microfinance,
              <br />
              made{' '}
              <span className="relative inline-block">
                <span className="relative z-10 italic">simple.</span>
                <svg
                  viewBox="0 0 220 24"
                  className="absolute -bottom-2 left-0 h-4 w-full text-[#F5C84B]"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M3 17 C 50 4, 110 4, 217 14" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#0B2B20]/70">
              Clients, loans, repayments and savings in one clean workspace. Every team member sees the tools for their
              role and nothing else.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#0B2B20] py-4 pl-8 pr-3 text-base font-bold text-white shadow-xl shadow-[#0B2B20]/20 transition hover:-translate-y-0.5 hover:bg-[#0F3D2D]"
              >
                Sign in to your account
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5C84B] text-[#0B2B20] transition group-hover:rotate-45">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Link>
              <button
                onClick={() => go('calculator')}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#0B2B20]/15 px-8 py-4 text-base font-bold transition hover:border-[#0B2B20] hover:bg-white"
              >
                <Calculator className="h-5 w-5" /> Try the loan calculator
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-[#0B2B20]/70">
              {['Role-based access', 'KYC storage', 'Live reports'].map((t) => (
                <span key={t} className="inline-flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0B2B20] text-[#F5C84B]">
                    <Check className="h-3 w-3" />
                  </span>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* card collage */}
          <div className="lp-hero-in relative mx-auto h-[30rem] w-full max-w-md" style={{ animationDelay: '0.15s' }}>
            {/* main card */}
            <div
              className="lp-bob absolute left-0 top-6 w-[82%] rounded-[2rem] bg-[#0B2B20] p-6 text-white shadow-2xl shadow-[#0B2B20]/30"
              style={{ '--r': '-4deg' }}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5C84B] text-[#0B2B20]">
                  <PiggyBank className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-[#F5C84B]">Savings</span>
              </div>
              <p className="mt-6 text-sm text-white/60">Account balance</p>
              <p className="font-display text-4xl font-semibold">ETB 24,500</p>
              <div className="mt-6 flex h-16 items-end gap-1.5">
                {BARS.map((h, i) => (
                  <div
                    key={i}
                    className={`lp-bar flex-1 rounded-t-md ${i === BARS.length - 1 ? 'bg-[#F5C84B]' : 'bg-white/25'}`}
                    style={{ height: `${h}%`, animationDelay: `${0.5 + i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>

            {/* loan card */}
            <div
              className="lp-bob-2 absolute right-0 top-40 w-[68%] rounded-[1.75rem] bg-[#F5C84B] p-5 text-[#0B2B20] shadow-2xl shadow-[#F5C84B]/30"
              style={{ '--r': '5deg' }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B2B20] text-sm font-bold text-[#F5C84B]">
                  A
                </span>
                <div>
                  <p className="text-sm font-bold">Loan application</p>
                  <p className="text-xs font-semibold text-[#0B2B20]/60">Small business loan</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/60 px-3 py-2.5">
                <span className="text-xs font-semibold">Status</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" /> Approved
                </span>
              </div>
            </div>

            {/* due card */}
            <div
              className="lp-bob absolute bottom-0 left-6 w-[62%] rounded-[1.5rem] border border-[#0B2B20]/10 bg-white p-4 shadow-2xl shadow-[#0B2B20]/10"
              style={{ '--r': '-2deg' }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">Due today</p>
                  <p className="text-xs font-semibold text-[#0B2B20]/50">Collect from the counter</p>
                </div>
              </div>
            </div>

            <p className="absolute -bottom-7 right-0 text-[11px] font-medium text-[#0B2B20]/40">Illustration</p>
          </div>
        </div>
      </section>

      {/* ───────── Ticker ───────── */}
      <section className="overflow-hidden border-y border-[#0B2B20]/10 bg-[#0B2B20] py-5" aria-hidden="true">
        <div className="lp-marquee flex w-max items-center gap-10 whitespace-nowrap">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-10 text-sm font-bold uppercase tracking-[0.2em] text-white/80">
              {t}
              <Sparkles className="h-4 w-4 text-[#F5C84B]" />
            </span>
          ))}
        </div>
      </section>

      {/* ───────── Bento features ───────── */}
      <section id="features" className="scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <Reveal className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-emerald-700">What you get</p>
            <h2 className="font-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
              One system for the whole lending cycle.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-6">
            {/* Clients */}
            <Reveal className="md:col-span-3">
              <div className="relative h-full overflow-hidden rounded-[2rem] bg-[#0B2B20] p-8 text-white">
                <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-400/25 blur-3xl" />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5C84B] text-[#0B2B20]">
                  <Users className="h-6 w-6" />
                </span>
                <h3 className="font-display relative mt-6 text-2xl font-semibold">Clients and KYC</h3>
                <p className="relative mt-3 max-w-sm leading-relaxed text-white/70">
                  One profile per member, with ID document and photo stored right beside it.
                </p>
                <div className="relative mt-8 flex items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                    <IdCard className="h-6 w-6 text-[#F5C84B]" />
                  </span>
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-2/3 rounded bg-white/30" />
                    <div className="h-2 w-1/3 rounded bg-white/15" />
                  </div>
                  <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300">KYC</span>
                </div>
              </div>
            </Reveal>

            {/* Loans */}
            <Reveal delay={80} className="md:col-span-3">
              <div className="relative h-full overflow-hidden rounded-[2rem] bg-[#F5C84B] p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B2B20] text-[#F5C84B]">
                  <Wallet className="h-6 w-6" />
                </span>
                <h3 className="font-display mt-6 text-2xl font-semibold">Loans and products</h3>
                <p className="mt-3 max-w-sm leading-relaxed text-[#0B2B20]/75">
                  Flat or declining interest, penalty and grace rules, and a clear path from application to disbursement.
                </p>
                <div className="mt-8 flex flex-wrap gap-2">
                  {['Pending', 'Approved', 'Disbursed', 'Closed'].map((s, i) => (
                    <span
                      key={s}
                      className={`rounded-full px-4 py-2 text-xs font-extrabold ${
                        i === 2 ? 'bg-[#0B2B20] text-white' : 'bg-white/60 text-[#0B2B20]'
                      }`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Repayments */}
            <Reveal className="md:col-span-2">
              <div className="h-full rounded-[2rem] border border-[#0B2B20]/10 bg-white p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <CreditCard className="h-6 w-6" />
                </span>
                <h3 className="font-display mt-5 text-xl font-semibold">Repayments</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#0B2B20]/65">
                  Record payments by cash, bank transfer or mobile money. See overdue loans and apply penalties.
                </p>
              </div>
            </Reveal>

            {/* Savings */}
            <Reveal delay={80} className="md:col-span-2">
              <div className="h-full rounded-[2rem] border border-[#0B2B20]/10 bg-white p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <PiggyBank className="h-6 w-6" />
                </span>
                <h3 className="font-display mt-5 text-xl font-semibold">Savings</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#0B2B20]/65">
                  Open accounts, take deposits, process withdrawals and keep a running balance history.
                </p>
              </div>
            </Reveal>

            {/* Reports */}
            <Reveal delay={160} className="md:col-span-2">
              <div className="h-full rounded-[2rem] border border-[#0B2B20]/10 bg-white p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <FileBarChart className="h-6 w-6" />
                </span>
                <h3 className="font-display mt-5 text-xl font-semibold">Reports</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#0B2B20]/65">
                  Summary, portfolio, collections, schedules and staff performance with clear charts.
                </p>
              </div>
            </Reveal>

            {/* Access */}
            <Reveal className="md:col-span-6">
              <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#0B2B20] to-[#14573B] p-8 text-white sm:p-10">
                <div className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-[#F5C84B]/25 blur-3xl" />
                <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-xl">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5C84B] text-[#0B2B20]">
                      <ShieldCheck className="h-6 w-6" />
                    </span>
                    <h3 className="font-display mt-5 text-2xl font-semibold sm:text-3xl">Everyone sees only what they need.</h3>
                    <p className="mt-3 leading-relaxed text-white/70">
                      Individual staff accounts, role-based menus, and access that can be switched off without losing history.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { l: 'Admin', c: 'bg-emerald-400 text-emerald-950' },
                      { l: 'Manager', c: 'bg-fuchsia-300 text-violet-950' },
                      { l: 'Cashier', c: 'bg-cyan-300 text-indigo-950' },
                      { l: 'Loan officer', c: 'bg-amber-300 text-orange-950' },
                    ].map((r) => (
                      <span key={r.l} className={`rounded-full px-5 py-2.5 text-sm font-extrabold ${r.c}`}>
                        {r.l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── Calculator ───────── */}
      <section id="calculator" className="scroll-mt-24 bg-[#0B2B20] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-14 max-w-2xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-[#F5C84B]">Play with the numbers</p>
            <h2 className="font-display mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
              See what a loan really costs.
            </h2>
            <p className="mt-4 text-lg text-white/65">
              Slide the amount, term and rate to see a monthly payment, the same way your team will explain it to clients.
            </p>
          </Reveal>
          <Reveal>
            <LoanCalculator />
          </Reveal>
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section id="how" className="scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <Reveal className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-emerald-700">The flow</p>
            <h2 className="font-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
              From first visit to final repayment.
            </h2>
          </Reveal>

          <div className="mt-14 divide-y divide-[#0B2B20]/10 border-y border-[#0B2B20]/10">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 60}>
                <div className="group grid items-center gap-4 py-8 transition hover:bg-white/60 sm:grid-cols-[6rem_1fr_auto] sm:px-4">
                  <span className="font-display text-6xl font-semibold text-[#0B2B20]/15 transition group-hover:text-[#F5C84B] sm:text-7xl">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-semibold">{s.title}</h3>
                    <p className="mt-2 max-w-xl leading-relaxed text-[#0B2B20]/65">{s.text}</p>
                  </div>
                  <span className="w-fit rounded-full bg-[#0B2B20] px-4 py-2 text-xs font-extrabold text-white">{s.tag}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Teams ───────── */}
      <section id="roles" className="scroll-mt-24 bg-white px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <Reveal className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-emerald-700">Built for teams</p>
            <h2 className="font-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
              A workspace for every role.
            </h2>
            <p className="mt-4 text-lg text-[#0B2B20]/65">
              Each role has its own colors, dashboard and menu, so nobody has to dig through tools they never use.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TEAMS.map((t, i) => (
              <Reveal key={t.name} delay={i * 80}>
                <div
                  className={`group relative h-full overflow-hidden rounded-[2rem] p-7 text-white transition duration-300 hover:-translate-y-2 ${t.bg}`}
                >
                  <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${t.glow}`} />
                  <span className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${t.chip}`}>
                    <t.icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-display relative mt-6 text-2xl font-semibold">{t.name}</h3>
                  <p className="relative mt-2 text-sm text-white/70">{t.line}</p>
                  <ul className="relative mt-6 space-y-2.5">
                    {t.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm font-semibold">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${t.chip}`}>
                          <Check className="h-3 w-3" />
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="px-5 py-24 sm:px-8">
        <Reveal>
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-[#F5C84B] px-8 py-16 text-center sm:px-16 sm:py-24">
            <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-[#0B2B20]/15 blur-3xl" />
            <div className="relative">
              <h2 className="font-display mx-auto max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
                Ready to open your workspace?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg font-medium text-[#0B2B20]/70">
                Sign in with your staff account and pick up right where your team left off.
              </p>
              <Link
                to="/login"
                className="group mt-10 inline-flex items-center gap-3 rounded-full bg-[#0B2B20] py-4 pl-9 pr-3 text-base font-bold text-white shadow-xl shadow-[#0B2B20]/25 transition hover:-translate-y-0.5 hover:bg-[#0F3D2D]"
              >
                Sign in
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5C84B] text-[#0B2B20] transition group-hover:rotate-45">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="px-5 pb-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 border-t border-[#0B2B20]/10 pt-8 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B2B20]">
              <Building2 className="h-5 w-5 text-[#F5C84B]" />
            </span>
            <div>
              <p className="font-display text-lg font-bold">DMMS</p>
              <p className="text-xs font-medium text-[#0B2B20]/55">Digital Microfinance Management System</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-5 text-sm font-semibold text-[#0B2B20]/60">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => go(n.id)} className="transition hover:text-[#0B2B20]">
                {n.label}
              </button>
            ))}
            <Link to="/login" className="font-bold text-[#0B2B20] underline decoration-[#F5C84B] decoration-2 underline-offset-4">
              Sign in
            </Link>
          </nav>
          <p className="text-xs text-[#0B2B20]/45">&copy; {new Date().getFullYear()} DMMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}