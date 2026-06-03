'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ClipboardList, LogOut, User, Layers } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const role = session.user.role;
  const isAdmin = role === 'ADMIN';

  const navLinks = isAdmin
    ? [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/products', label: 'Manage Products', icon: Package },
        { href: '/admin/inventory', label: 'Inventory', icon: Layers },
      ]
    : [
        { href: '/seller', label: 'New Order', icon: Package },
        { href: '/seller/orders', label: 'My Orders', icon: ClipboardList },
      ];

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/75 text-slate-100 border-b border-slate-800/50 backdrop-blur-xl px-4 sm:px-6 py-3.5 shadow-lg shadow-slate-950/15">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 group">
          <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-teal-500/30 text-teal-400 group-hover:scale-105 transition-all duration-300 shadow-md shadow-teal-500/5">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-teal-300 via-emerald-300 to-indigo-300 bg-clip-text text-transparent">
              PharmaFlow
            </span>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest -mt-0.5">
              Inventory OS
            </span>
          </div>
          <span className="text-[9px] font-bold bg-teal-500/10 border border-teal-500/30 text-teal-400 px-2 py-0.5 rounded-full select-none ml-1">
            {role}
          </span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-200 border ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/25 shadow-inner'
                    : 'text-slate-400 border-transparent hover:text-slate-100 hover:bg-slate-900/60 hover:border-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-900/50 border border-slate-850 px-3 py-1.5 rounded-xl">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
            <span className="max-w-[120px] truncate">{session.user.name || session.user.email}</span>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 text-slate-300 font-semibold text-xs active:scale-95 transition-all duration-150 cursor-pointer shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Links */}
      <div className="mt-3 pt-2.5 border-t border-slate-900/65 flex md:hidden items-center justify-around gap-2">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl text-[10px] font-semibold tracking-wide uppercase transition-all ${
                isActive 
                  ? 'text-teal-400 bg-teal-500/5 border border-teal-500/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
