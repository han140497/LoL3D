import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const inputClass =
  'w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-brand-500';

export default function LoginPage() {
  const { user, configured, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('signin'); // signin | signup
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [signupDone, setSignupDone] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const redirectTo = location.state?.from ?? '/account';

  if (!configured) {
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-white">Accounts aren't set up yet</h1>
        <p className="mt-3 text-slate-400">
          Customer login needs the Supabase backend connected. You can still shop and check out
          as a guest — accounts add order history on top.
        </p>
        <Link to="/catalog" className="mt-6 inline-block text-brand-400 hover:text-brand-500">
          ← Keep shopping
        </Link>
      </main>
    );
  }

  if (user) {
    navigate(redirectTo, { replace: true });
    return null;
  }

  if (signupDone) {
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <div className="text-5xl">📬</div>
        <h1 className="mt-4 text-2xl font-bold text-white">Check your email</h1>
        <p className="mt-3 text-slate-400">
          We sent a confirmation link to <span className="text-white">{form.email}</span>. Click it,
          then sign in here.
        </p>
      </main>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result =
      mode === 'signin'
        ? await signIn(form.email, form.password)
        : await signUp(form.email, form.password, form.name);
    setBusy(false);
    if (result.error) return setError(result.error);
    if (mode === 'signup') return setSignupDone(true);
    navigate(redirectTo, { replace: true });
  };

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-white">
        {mode === 'signin' ? 'Sign in' : 'Create your account'}
      </h1>
      <p className="mt-2 text-slate-400">
        {mode === 'signin'
          ? 'Track your orders and check out faster.'
          : 'One account for order history and faster checkout.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">Full name</label>
            <input id="name" required value={form.name} onChange={set('name')} className={inputClass} autoComplete="name" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
          <input id="email" required type="email" value={form.email} onChange={set('email')} className={inputClass} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
          <input
            id="password" required type="password" minLength={8}
            value={form.password} onChange={set('password')} className={inputClass}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-brand-500 py-3.5 font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        {mode === 'signin' ? "New to LoL3D?" : 'Already have an account?'}{' '}
        <button
          type="button"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
          className="font-semibold text-brand-400 hover:text-brand-500"
        >
          {mode === 'signin' ? 'Create an account' : 'Sign in'}
        </button>
      </p>
    </main>
  );
}
