'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUserAction } from '@/actions/users';
import { KeyRound, Mail, User, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validations
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await registerUserAction({
        name,
        email,
        password,
      });

      if (!res.success) {
        setError(res.error || 'Registration failed');
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
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
            <User className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
            Create Seller Account
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Sign up to register as a pharmacist / sales operator
          </p>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-4 animate-in fade-in duration-300">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Registration Successful!</h3>
              <p className="text-xs text-slate-400 mt-1">Redirecting you to the login portal...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4.5 relative">
            {error && (
              <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-in shake duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ayush Agrawal"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-xs font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-xs font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Choose Password *
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (Min 6 chars)"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-xs font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Confirm Password *
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-xs font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 active:scale-[0.98] font-bold text-xs tracking-wider uppercase text-white shadow-lg hover:shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-teal-300" />
                  Creating Account...
                </>
              ) : (
                'Register Seller'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400">
            Already have an operator account?{' '}
            <Link href="/login" className="text-teal-400 hover:text-teal-300 font-bold transition-colors">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
