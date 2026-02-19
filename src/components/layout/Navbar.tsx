'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '../common/Logo';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';
import { LayoutDashboard, LogOut, Search, Settings, User, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { open } = useWeb3Modal();
  const { isConnected, address } = useAccount();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'ALL' | 'ROI' | 'CHARITY'>('ALL');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const exploreHref = useMemo(() => {
    const sp = new URLSearchParams();
    if (searchQuery.trim()) sp.set('search', searchQuery.trim());
    if (searchType !== 'ALL') sp.set('type', searchType);
    const qs = sp.toString();
    return qs ? `/explore?${qs}` : '/explore';
  }, [searchQuery, searchType]);

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (e.target instanceof Node && !searchWrapRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  const submitSearch = () => {
    router.push(exploreHref);
    setIsSearchOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--card)]/80 backdrop-blur-md border-b border-[var(--border)] transition-colors duration-300">
      <div className="container mx-auto px-6 h-[72px] flex items-center justify-between relative">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo size={26} />
          </Link>
        </div>

        {/* Centered search + type tabs (Republic style) */}
        <div className="hidden md:flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
          <div className="relative group">
            <button className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors tracking-tight px-3 py-2 rounded-xl hover:bg-[var(--secondary)]">
              Explore
              <ChevronDown size={16} className="opacity-70" />
            </button>
            <div className="absolute left-0 mt-3 w-56 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <Link href="/explore" className="block px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                All Projects
              </Link>
              <Link href="/explore?type=CHARITY" className="block px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                Charity Projects
              </Link>
              <Link href="/explore?type=ROI" className="block px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                ROI Projects
              </Link>
            </div>
          </div>

          <div ref={searchWrapRef} className="relative w-[360px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitSearch();
                  if (e.key === 'Escape') setIsSearchOpen(false);
                }}
                placeholder="Search projects..."
                className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-2xl h-11 pl-11 pr-24 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
              <button
                onClick={submitSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-4 rounded-xl bg-[var(--primary)] text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
              >
                Search
              </button>
            </div>

            {isSearchOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-2 flex gap-2">
                  <TypeTab label="All" active={searchType === 'ALL'} onClick={() => setSearchType('ALL')} theme="blue" />
                  <TypeTab label="ROI" active={searchType === 'ROI'} onClick={() => setSearchType('ROI')} theme="blue" />
                  <TypeTab label="Charity" active={searchType === 'CHARITY'} onClick={() => setSearchType('CHARITY')} theme="green" />
                </div>
                <div className="px-4 pb-4 pt-1 text-xs font-bold text-[var(--text-muted)]">
                  Press Enter to search
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-5">

          {user ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => open()}
                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--secondary)] text-[var(--primary)] text-xs font-bold transition-all border border-[var(--primary)]/10"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Link Wallet'}
              </button>

              <div className="relative group">
                <button className="w-10 h-10 rounded-xl bg-[var(--secondary)] text-[var(--primary)] flex items-center justify-center border border-[var(--primary)]/10 hover:border-[var(--primary)] transition-all">
                  <User size={20} />
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                    <User size={16} /> My Profile
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

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors tracking-tight"
  >
    {children}
  </Link>
);

const TypeTab = ({
  label,
  active,
  onClick,
  theme,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  theme: 'blue' | 'green';
}) => {
  const activeClass = theme === 'green' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white';
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${active ? activeClass : 'bg-[var(--secondary)] text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
    >
      {label}
    </button>
  );
};

export default Navbar;
