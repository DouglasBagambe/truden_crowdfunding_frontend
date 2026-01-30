'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '../common/Logo';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';
import { ThemeToggle } from '../common/ThemeToggle';
import { User, LogOut, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { open } = useWeb3Modal();
  const { isConnected, address } = useAccount();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--card)]/80 backdrop-blur-md border-b border-[var(--border)] transition-colors duration-300">
      <div className="container mx-auto px-6 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo size={26} />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/explore">Explore</NavLink>
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/dao">DAO</NavLink>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <ThemeToggle />
          
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
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                    <User size={16} /> My Profile
                  </Link>
                  <Link href="/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors">
                    Settings
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

export default Navbar;
