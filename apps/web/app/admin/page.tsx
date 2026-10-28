'use client';

import { useState } from 'react';
import { Activity, CircleDollarSign, LogOut, Users, Wifi } from 'lucide-react';

const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
type Stats = { activeSessions: number; pendingPayments: number; customers: number; confirmedTodayMinor?: number };

export default function AdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${api}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
      });
      const result = await response.json() as { accessToken?: string; message?: string };
      if (!response.ok || !result.accessToken) throw new Error(result.message ?? 'Sign-in failed.');
      setToken(result.accessToken);
      const dashboard = await fetch(`${api}/admin/dashboard`, { headers: { Authorization: `Bearer ${result.accessToken}` } });
      if (!dashboard.ok) throw new Error('Could not load operations overview.');
      setStats(await dashboard.json() as Stats);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  const cards = stats ? [
    { label: 'Active network sessions', value: stats.activeSessions.toLocaleString(), icon: Wifi },
    { label: 'Pending payments', value: stats.pendingPayments.toLocaleString(), icon: Activity },
    { label: 'Customers', value: stats.customers.toLocaleString(), icon: Users },
    { label: 'Confirmed today', value: typeof stats.confirmedTodayMinor === 'number' ? `KES ${(stats.confirmedTodayMinor / 100).toLocaleString('en-KE', { maximumFractionDigits: 2 })}` : 'Restricted', icon: CircleDollarSign },
  ] : [];

  return <main className="min-h-screen bg-stone-50">
    <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
      <a href="/" className="flex items-center gap-2 font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-honey-500 text-white"><Wifi size={19} /></span>HiveNet Operations</a>
      {token && <button onClick={() => { setToken(''); setStats(null); }} className="flex items-center gap-2 text-sm text-stone-600 hover:text-ink"><LogOut size={16} />Sign out</button>}
    </header>
    <div className="mx-auto max-w-6xl px-5 py-10">
      {!stats ? <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-bold">Staff sign in</h1><p className="mt-2 text-sm text-stone-600">Use your authorized HiveNet operations account.</p>
        <form className="mt-6 space-y-4" onSubmit={(event) => void signIn(event)}>
          <label className="block text-sm font-semibold" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-stone-300 px-3 py-2.5" />
          <label className="block text-sm font-semibold" htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-stone-300 px-3 py-2.5" />
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-honey-500 px-4 py-3 font-semibold text-white hover:bg-honey-700 disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in securely'}</button>
        </form>
      </div> : <>
        <div><p className="text-sm font-semibold uppercase tracking-widest text-honey-700">Operations</p><h1 className="mt-2 text-3xl font-bold">Network overview</h1><p className="mt-2 text-sm text-stone-600">Live totals from HiveNet records. Refresh the page to update.</p></div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-stone-500"><span className="text-sm">{label}</span><Icon size={19} /></div><p className="mt-5 text-2xl font-bold">{value}</p></article>)}
        </div>
        <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5 text-sm leading-6 text-stone-600">Router access, staff roles and site-level operations must be configured and enabled before they appear here. Pending network activation is retained for operator follow-up; this dashboard does not report simulated router status.</div>
      </>}
    </div>
  </main>;
}
