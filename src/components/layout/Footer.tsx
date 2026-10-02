"use client";

import React from "react";
import { Logo } from "../common/Logo";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)] py-10">
      <div className="page-shell">
        {/* Top grid */}
        <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 space-y-3 md:col-span-1">
            <Logo size={24} />
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-[220px]">
              Clear campaign discovery, accountable fundraising, and secure
              account management.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-main)]">
              Platform
            </h4>
            <ul className="space-y-3">
              <FooterLink href="/explore">Browse Projects</FooterLink>
              <FooterLink href="/explore?type=CHARITY">
                Charity Causes
              </FooterLink>
              <FooterLink href="/explore?type=ROI">Investments</FooterLink>
              <FooterLink href="/dashboard/create-project">
                Start a Campaign
              </FooterLink>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-main)]">
              Company
            </h4>
            <ul className="space-y-3">
              <FooterLink href="/dashboard">Dashboard</FooterLink>
              <FooterLink href="/profile">Account Settings</FooterLink>
              <FooterLink href="/explore">Explore</FooterLink>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-main)]">
              Legal
            </h4>
            <ul className="space-y-3">
              <FooterLink href="/terms">Terms of Service</FooterLink>
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/support">Contact Support</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--border)] pt-6 sm:flex-row">
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} KEIBO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

const FooterLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
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
