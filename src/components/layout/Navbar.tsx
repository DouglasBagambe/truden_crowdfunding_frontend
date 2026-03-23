'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '../common/Logo';
import {
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  User,
  ChevronDown,
  Heart,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID || '';

  const isAdmin = React.useMemo(() => {
    if (!user) return false;
    const uid = user.id || user._id || '';
    const hasAdminRole = (user.roles || []).some((r: string) =>
      ['ADMIN', 'admin', 'SUPER_ADMIN'].includes(r)
    );
    return (ADMIN_USER_ID && uid === ADMIN_USER_ID) || hasAdminRole;
  }, [user, ADMIN_USER_ID]);

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [router]);

  // Close mobile menu on outside click
  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const submitSearch = () => {
    const sp = new URLSearchParams();
    if (searchQuery.trim()) sp.set('search', searchQuery.trim());
    const qs = sp.toString();
    router.push(qs ? `/explore?${qs}` : '/explore');
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
  };

  const navCategories = [
    { href: '/explore', label: 'All Projects' },
    { href: '/explore?category=HEALTH', label: 'Health' },
    { href: '/explore?category=EDUCATION', label: 'Education' },
    { href: '/explore?category=ENVIRONMENT', label: 'Environment' },
    { href: '/explore?category=COMMUNITY', label: 'Community' },
    { href: '/explore?industry=REAL_ESTATE', label: 'Real Estate' },
    { href: '/explore?industry=TECHNOLOGY', label: 'Technology' },
    { href: '/explore?industry=AGRICULTURE', label: 'Agriculture' },
    { href: '/explore?industry=ENERGY', label: 'Energy' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border)] transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 h-[68px] flex items-center justify-between relative">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
              <Logo size={26} />
            </Link>
          </div>

          {/* Desktop Center: Explore dropdown + Search */}
          <div className="hidden md:flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
            {/* Explore dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors tracking-tight px-3 py-2 rounded-xl hover:bg-[var(--secondary)]">
                Explore
                <ChevronDown size={16} className="opacity-70" />
              </button>
              <div className="absolute left-0 mt-3 w-52 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {navCategories.map((cat) => (
                  <Link key={cat.href} href={cat.href} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                    {cat.label}
                  </Link>
                ))}
                <div className="border-t border-[var(--border)] mt-1 pt-1">
                  <Link href="/dashboard/create-project" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors">
                    + Start a Campaign
                  </Link>
                </div>
              </div>
            </div>

            {/* Marketplace link
            <Link
              href="/marketplace"
              className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-muted)] hover:text-purple-500 transition-colors tracking-tight px-3 py-2 rounded-xl hover:bg-purple-500/5"
            >
              <Store size={15} className="text-purple-500" />
              Marketplace
            </Link> */}

            {/* Search bar */}
            <div ref={searchWrapRef} className="relative w-[320px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
                  placeholder="Search causes..."
                  className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-2xl h-11 pl-11 pr-24 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                />
                <button
                  onClick={submitSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-4 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Right: Auth */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/create-project"
                  className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold transition-all hover:bg-emerald-700"
                >
                  + Start Campaign
                </Link>
                <div className="relative group">
                  <button className="w-10 h-10 rounded-xl bg-[var(--secondary)] text-[var(--primary)] flex items-center justify-center border border-[var(--primary)]/10 hover:border-[var(--primary)] transition-all">
                    <User size={20} />
                  </button>
                  <div className="absolute right-0 mt-2 w-52 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                      <LayoutDashboard size={16} /> Dashboard
                    </Link>
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                      <Settings size={16} /> Settings
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors border-t border-[var(--border)] mt-1 pt-2">
                        <ShieldCheck size={16} /> Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors border-t border-[var(--border)] mt-2"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-bold text-[var(--text-main)] hover:text-[var(--primary)] transition-colors px-3">
                  Sign In
                </Link>
                <Link href="/register" className="button_primary py-2 px-5 text-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right: Search icon + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => { setMobileSearchOpen(!mobileSearchOpen); setMobileMenuOpen(false); }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
            <button
              onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setMobileSearchOpen(false); }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>

        {/* Mobile Search Bar (sliding) */}
        {mobileSearchOpen && (
          <div className="md:hidden border-t border-[var(--border)] px-4 py-3 bg-[var(--card)]/95 backdrop-blur-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
                placeholder="Search causes..."
                className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-2xl h-12 pl-11 pr-24 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <button
                onClick={submitSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
              >
                Go
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Full-Screen Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" ref={mobileMenuRef}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Slide-in drawer from right */}
          <div className="absolute top-[68px] right-0 bottom-0 w-[85%] max-w-sm bg-[var(--card)] border-l border-[var(--border)] shadow-2xl flex flex-col overflow-y-auto">

            {/* User section */}
            <div className="p-5 border-b border-[var(--border)]">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--secondary)] text-[var(--primary)] flex items-center justify-center border border-[var(--primary)]/20 flex-shrink-0">
                    <User size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-[var(--text-main)] truncate">
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-black text-sm text-[var(--text-muted)] uppercase tracking-widest">Welcome to Keibo</p>
                  <div className="flex gap-3">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-bold text-center text-[var(--text-main)] hover:bg-[var(--secondary)] transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-white text-sm font-bold text-center hover:opacity-90 transition-all"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Nav Links */}
            <div className="flex-1 p-4 space-y-1">
              {user && (
                <>
                  <MobileNavLink
                    href="/marketplace"
                    icon={<Store size={18} className="text-purple-500" />}
                    label="Marketplace"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <MobileNavLink
                    href="/dashboard"
                    icon={<LayoutDashboard size={18} />}
                    label="Dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <MobileNavLink
                    href="/profile"
                    icon={<Settings size={18} />}
                    label="Settings"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  {isAdmin && (
                    <MobileNavLink
                      href="/admin"
                      icon={<ShieldCheck size={18} className="text-amber-500" />}
                      label="Admin Dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                    />
                  )}
                  <div className="py-2">
                    <div className="h-px bg-[var(--border)]" />
                  </div>
                </>
              )}

              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] px-3 py-1">Explore</p>

              {navCategories.map((cat) => (
                <MobileNavLink
                  key={cat.href}
                  href={cat.href}
                  icon={<Heart size={18} />}
                  label={cat.label}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}

              <div className="py-2">
                <div className="h-px bg-[var(--border)]" />
              </div>

              <Link
                href="/dashboard/create-project"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between gap-3 px-4 py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm transition-all hover:bg-emerald-700 active:scale-[0.98] mx-1 mt-2"
              >
                <span>Start a Campaign</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Sign Out */}
            {user && (
              <div className="p-4 border-t border-[var(--border)]">
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-rose-500/20"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const MobileNavLink = ({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--secondary)] transition-all"
  >
    <span className="text-[var(--text-muted)]">{icon}</span>
    {label}
  </Link>
);

export default Navbar;
