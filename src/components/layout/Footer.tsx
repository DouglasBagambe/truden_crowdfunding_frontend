'use client';

import React, { useState } from 'react';
import { Logo } from '../common/Logo';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[var(--card)] border-t border-[var(--border)] pt-12 pb-8 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Top Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-4">
            <Logo size={24} />
            <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed max-w-xs">
              Empowering global innovation through decentralized milestone-based funding on the Celo network.
            </p>
          </div>

          {/* Footer sections — collapse on mobile */}
          <CollapsibleFooterSection title="Protocol">
            <FooterLink href="/explore">Explore Projects</FooterLink>
            <FooterLink href="/how-it-works">How It Works</FooterLink>
            <FooterLink href="/dao">Governance</FooterLink>
            <FooterLink href="/stats">Market Stats</FooterLink>
          </CollapsibleFooterSection>

          <CollapsibleFooterSection title="Resources">
            <FooterLink href="/docs">Documentation</FooterLink>
            <FooterLink href="/terms">Terms of Service</FooterLink>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
            <FooterLink href="/audit">Security Audit</FooterLink>
          </CollapsibleFooterSection>

          <CollapsibleFooterSection title="Connect">
            <FooterLink href="https://twitter.com/keibo">X / Twitter</FooterLink>
            <FooterLink href="https://discord.gg/keibo">Discord</FooterLink>
            <FooterLink href="https://github.com/keibo">GitHub</FooterLink>
            <FooterLink href="mailto:hello@keibo.io">Email Support</FooterLink>
          </CollapsibleFooterSection>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 text-center sm:text-left">
            © 2026 Keibo. Build trust, fund the future.
          </p>
          <div className="flex gap-6">
            <button className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">Network Status</button>
            <button className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">Security</button>
            <button className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">Contact</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

const CollapsibleFooterSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      {/* Mobile: collapsible header */}
      <button
        className="sm:cursor-default flex items-center justify-between w-full sm:pointer-events-none"
        onClick={() => setOpen((v) => !v)}
      >
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-main)]">{title}</h4>
        <ChevronDown
          size={14}
          className={`text-[var(--text-muted)] transition-transform sm:hidden ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <ul className={`space-y-3 overflow-hidden transition-all duration-300 ${open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 sm:max-h-none sm:opacity-100'}`}>
        {children}
      </ul>
    </div>
  );
};

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <Link href={href} className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
      {children}
    </Link>
  </li>
);

export default Footer;
