'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.toLowerCase(),
        password,
        redirect: false, // Handle redirect manually
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        // Redirection logic is handled by route protection, 
        // but we fetch session or push to dashboard to trigger middleware check.
        // We can check user role by hitting a quick endpoint or decoding or just pushing to admin.
        // Let's call session API to determine where to redirect the user
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        
        if (session?.user?.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/seller');
        }
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4 bg-radial from-slate-900 via-slate-950 to-black text-white min-h-screen">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

        <div className="text-center mb-8 relative">
          <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
            PharmaFlow
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Sign in to manage your pharmaceutical inventory and quotations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 active:scale-[0.98] font-semibold text-white shadow-lg hover:shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center space-y-3.5">
          <p className="text-xs text-slate-400">
            Need an operator account?{' '}
            <Link href="/signup" className="text-teal-400 hover:text-teal-300 font-bold transition-colors">
              Create Seller Account
            </Link>
          </p>
          <p className="text-[10px] text-slate-500">
            For demonstration credentials, please check the system seed instructions.
          </p>
        </div>
      </div>
    </main>
  );
}
