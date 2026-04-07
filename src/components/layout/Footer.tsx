'use client';

import React from 'react';
import { useRoiAccess } from '@/hooks/useRoiAccess';
import { Logo } from '../common/Logo';
import Link from 'next/link';
import { Mail, Twitter, MessageCircle } from 'lucide-react';

const Footer = () => {
  const { hasRoiAccess } = useRoiAccess();

  return (
    <footer className="bg-[var(--card)] border-t border-[var(--border)] pt-14 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Top grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1 space-y-4">
            <Logo size={24} />
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-[220px]">
              A platform where ideas get funded, causes get supported, and communities grow.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://x.com/realdyson_"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X / Twitter"
                className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border)] transition-all"
              >
                <Twitter size={14} />
              </a>
              <a
                href="https://wa.me/256770919175"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-all"
              >
                <MessageCircle size={14} />
              </a>
              <a
                href="mailto:hello@keiboroi.netlify.app"
                aria-label="Email"
                className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all"
              >
                <Mail size={14} />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-main)]">Platform</h4>
            <ul className="space-y-3">
              <FooterLink href="/explore">Browse Projects</FooterLink>
              <FooterLink href="/explore?type=CHARITY">Charity Causes</FooterLink>
              {hasRoiAccess && <FooterLink href="/explore?type=ROI">Investments</FooterLink>}
              <FooterLink href="/dashboard/create-project">Start a Campaign</FooterLink>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-main)]">Company</h4>
            <ul className="space-y-3">
              <FooterLink href="/dashboard">Dashboard</FooterLink>
              <FooterLink href="/settings">Account Settings</FooterLink>
              <FooterLink href="/explore">Explore</FooterLink>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-main)]">Legal</h4>
            <ul className="space-y-3">
              <FooterLink href="/terms">Terms of Service</FooterLink>
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="mailto:hello@keiboroi.netlify.app">Contact Support</FooterLink>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} <a href="https://www.truden.net/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-main)] transition-colors font-semibold">Truden Tech Ltd.</a> All rights reserved.
          </p>

        </div>

      </div>
    </footer>
  );
};

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <Link
      href={href}
      className="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors font-medium"
    >
      {children}
    </Link>
  </li>
);

export default Footer;
