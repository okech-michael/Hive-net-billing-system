'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, Clock3, LoaderCircle, Wifi } from 'lucide-react';

type InternetPackage = {
  id: string;
  name: string;
  description: string | null;
  priceMinor: number;
  currency: string;
  durationSeconds: number;
  deviceLimit: number;
};

type Payment = { orderId: string; status: string };
const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

function formatDuration(seconds: number): string {
  if (seconds % 2_592_000 === 0) return `${seconds / 2_592_000} month${seconds / 2_592_000 === 1 ? '' : 's'}`;
  if (seconds % 604_800 === 0) return `${seconds / 604_800} week${seconds / 604_800 === 1 ? '' : 's'}`;
  if (seconds % 3_600 === 0) return `${seconds / 3_600} hour${seconds / 3_600 === 1 ? '' : 's'}`;
  return `${Math.round(seconds / 60)} minutes`;
}

export default function Portal() {
  const [packages, setPackages] = useState<InternetPackage[]>([]);
  const [selected, setSelected] = useState<InternetPackage | null>(null);
  const [phone, setPhone] = useState('');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    fetch(`${api}/packages?tenant=hivenet`, { signal: abort.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Packages are temporarily unavailable.');
        setPackages(await response.json() as InternetPackage[]);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') setMessage(error.message);
      });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    if (!payment || payment.status !== 'PENDING') return;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`${api}/payments/${payment.orderId}`);
        if (!response.ok) return;
        const result = await response.json() as { status: string; entitlement?: { status: string; expiresAt: string } | null };
        if (result.status !== payment.status) setPayment({ ...payment, status: result.status });
        if (result.status === 'CONFIRMED') setMessage('Payment confirmed. Your package is ready; network authorization is being processed.');
        if (result.status === 'FAILED') setMessage('Payment was not completed. You can try again with a new request.');
      } catch {
        setMessage('Unable to refresh payment status. Your payment is still being processed.');
      }
    }, 3_000);
    return () => window.clearInterval(timer);
  }, [payment]);

  async function beginPayment(): Promise<void> {
    if (!selected || loading) return;
    setLoading(true);
    setMessage('Preparing your payment.');
    try {
      const response = await fetch(`${api}/payments/mpesa/stk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ tenant: 'hivenet', packageId: selected.id, phone }),
      });
      const data = await response.json() as Payment & { message?: string };
      if (!response.ok) throw new Error(data.message ?? 'Could not start payment. Please check the number and try again.');
      setPayment(data);
      setMessage(data.status === 'PENDING' ? 'Check your phone for the M-Pesa prompt, then wait here for confirmation.' : 'Payment request status: ' + data.status.toLowerCase());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Payment request failed.');
    } finally {
      setLoading(false);
    }
  }

  const waiting = loading || payment?.status === 'PENDING';
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <a href="/" className="flex items-center gap-2 font-bold tracking-tight text-ink" aria-label="HiveNet home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-honey-500 text-white"><Wifi size={19} /></span>
          <span className="text-xl">HiveNet</span>
        </a>
        <a href="/admin" className="text-sm font-semibold text-honey-900 hover:underline">Staff sign in</a>
      </header>

      <section className="hive-pattern border-y border-honey-100">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.1fr_.9fr] md:items-center md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-honey-900 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-green-600" /> Simple. Reliable. Local.
            </span>
            <h1 className="mt-6 max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Internet that keeps you connected.</h1>
            <p className="mt-4 max-w-lg text-lg leading-7 text-stone-600">Choose a plan, pay securely with M-Pesa and get online. No complicated sign-up.</p>
            <a href="#plans" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-honey-500 px-5 py-3 font-semibold text-white transition hover:bg-honey-700">
              Explore packages <ArrowRight size={17} />
            </a>
          </div>
          <div className="rounded-3xl border border-white bg-white/90 p-6 shadow-card sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-honey-50 text-honey-700"><Clock3 size={22} /></span>
              <div><h2 className="font-bold">Get online in minutes</h2><p className="text-sm text-stone-500">A secure prompt goes straight to your phone.</p></div>
            </div>
            <ol className="mt-6 space-y-4 text-sm text-stone-700">
              {['Choose a package that suits you', 'Enter your M-Pesa phone number', 'Approve the prompt on your phone'].map((step, index) => (
                <li key={step} className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-honey-50 font-bold text-honey-900">{index + 1}</span>{step}</li>
              ))}
            </ol>
            <p className="mt-6 rounded-lg bg-stone-50 p-3 text-xs leading-5 text-stone-500">HiveNet will never ask for your M-Pesa PIN. Enter it only in the official Safaricom prompt.</p>
          </div>
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-6xl px-5 py-14">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm font-bold uppercase tracking-widest text-honey-700">Flexible access</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Choose your package</h2></div>
          <p className="text-sm text-stone-500">Secure M-Pesa checkout · No hidden fees</p>
        </div>
        {packages.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-600">{message || 'Loading available packages…'}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((item) => {
              const active = selected?.id === item.id;
              return <button key={item.id} onClick={() => setSelected(item)} className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-card ${active ? 'border-honey-500 ring-2 ring-honey-100' : 'border-stone-200'}`} aria-pressed={active}>
                <div className="flex items-start justify-between"><div><p className="font-bold">{item.name}</p><p className="mt-1 text-sm text-stone-500">{item.description || formatDuration(item.durationSeconds)} access</p></div>{active && <Check size={19} className="text-honey-700" />}</div>
                <p className="mt-5 text-3xl font-bold">{item.currency} {(item.priceMinor / 100).toLocaleString('en-KE', { maximumFractionDigits: 2 })}</p>
                <p className="mt-1 text-xs text-stone-500">{formatDuration(item.durationSeconds)} · {item.deviceLimit} device{item.deviceLimit === 1 ? '' : 's'}</p>
              </button>;
            })}
          </div>
        )}
      </section>

      <section className="border-t border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1fr_1fr] md:items-start">
          <div><h2 className="text-2xl font-bold">Ready to connect?</h2><p className="mt-2 max-w-md text-sm leading-6 text-stone-600">Select a package above, enter your Safaricom number and approve the payment request sent to your phone.</p></div>
          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void beginPayment(); }}>
            <label htmlFor="phone" className="block text-sm font-semibold">M-Pesa phone number</label>
            <div className="flex gap-2">
              <input id="phone" autoComplete="tel" inputMode="tel" required minLength={9} maxLength={18} placeholder="07XX XXX XXX" value={phone} onChange={(event) => setPhone(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-4 py-3" />
              <button type="submit" disabled={!selected || waiting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-honey-500 px-4 py-3 font-semibold text-white transition hover:bg-honey-700 disabled:cursor-not-allowed disabled:opacity-50">
                {waiting ? <LoaderCircle className="animate-spin" size={17} /> : null} Pay
              </button>
            </div>
            {!selected && <p className="text-xs text-stone-500">Select a package to continue.</p>}
            {message && <p role="status" aria-live="polite" className="rounded-lg bg-honey-50 px-3 py-2 text-sm text-honey-900">{message}</p>}
            {payment && <p className="text-xs text-stone-500">Order {payment.orderId.slice(0, 8)} · {payment.status.toLowerCase()}</p>}
          </form>
        </div>
      </section>
      <footer className="border-t border-stone-200 px-5 py-6 text-center text-xs text-stone-500">HiveNet · Internet that keeps you connected.</footer>
    </main>
  );
}
