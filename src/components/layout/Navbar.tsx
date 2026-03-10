'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '../common/Logo';
import { LayoutDashboard, LogOut, Search, Settings, User, ChevronDown, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (e.target instanceof Node && !searchWrapRef.current.contains(e.target)) {
        // noop
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  const submitSearch = () => {
    const sp = new URLSearchParams();
    if (searchQuery.trim()) sp.set('search', searchQuery.trim());
    const qs = sp.toString();
    router.push(qs ? `/explore?${qs}` : '/explore');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--card)]/80 backdrop-blur-md border-b border-[var(--border)] transition-colors duration-300">
      <div className="container mx-auto px-6 h-[72px] flex items-center justify-between relative">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo size={26} />
          </Link>
        </div>

        {/* Centered search + Explore dropdown */}
        <div className="hidden md:flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
          {/* Explore dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors tracking-tight px-3 py-2 rounded-xl hover:bg-[var(--secondary)]">
              Explore
              <ChevronDown size={16} className="opacity-70" />
            </button>
            <div className="absolute left-0 mt-3 w-52 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <Link href="/explore" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                All Causes
              </Link>
              <Link href="/explore?category=HEALTH" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                Health
              </Link>
              <Link href="/explore?category=EDUCATION" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                Education
              </Link>
              <Link href="/explore?category=ENVIRONMENT" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                Environment
              </Link>
              <Link href="/explore?category=COMMUNITY" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                Community
              </Link>
              <div className="border-t border-[var(--border)] mt-1 pt-1">
                <Link href="/dashboard/create-project" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors">
                  + Start a Campaign
                </Link>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div ref={searchWrapRef} className="relative w-[340px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitSearch();
                }}
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

        <div className="flex items-center gap-5">
          {user ? (
            <div className="flex items-center gap-4">
              {/* Start Campaign CTA */}
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
                  <Link href="/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                    <Settings size={16} /> Settings
                  </Link>
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
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-bold text-[var(--text-main)] hover:text-[var(--primary)] transition-colors px-4">
                Sign In
              </Link>
              <Link href="/register" className="button_primary py-2.5">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
