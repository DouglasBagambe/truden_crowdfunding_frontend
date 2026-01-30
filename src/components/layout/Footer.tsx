'use client';

import React from 'react';
import { Logo } from '../common/Logo';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-[var(--card)] border-t border-[var(--border)] pt-20 pb-10 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1 space-y-6">
            <Logo size={24} />
            <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed max-w-xs">
              Empowering global innovation through decentralized milestone-based funding on the Celo network.
            </p>
          </div>

          <FooterSection title="Protocol">
            <FooterLink href="/explore">Explore Projects</FooterLink>
            <FooterLink href="/how-it-works">How It Works</FooterLink>
            <FooterLink href="/dao">Governance</FooterLink>
            <FooterLink href="/stats">Market Stats</FooterLink>
          </FooterSection>

          <FooterSection title="Resources">
            <FooterLink href="/docs">Documentation</FooterLink>
            <FooterLink href="/terms">Terms of Service</FooterLink>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
            <FooterLink href="/audit">Security Audit</FooterLink>
          </FooterSection>

          <FooterSection title="Connect">
            <FooterLink href="https://twitter.com/trufund">X / Twitter</FooterLink>
            <FooterLink href="https://discord.gg/trufund">Discord</FooterLink>
            <FooterLink href="https://github.com/trufund">GitHub</FooterLink>
            <FooterLink href="mailto:hello@trufund.io">Email Support</FooterLink>
          </FooterSection>
        </div>

        <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">
            © 2026 TruFund. Build trust, fund the future.
          </p>
          <div className="flex gap-8">
            <button className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">Network Status</button>
            <button className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">Security</button>
            <button className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">Contact</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-6">
    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-main)]">{title}</h4>
    <ul className="space-y-3">
      {children}
    </ul>
  </div>
);

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <Link href={href} className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
      {children}
    </Link>
  </li>
);

export default Footer;
