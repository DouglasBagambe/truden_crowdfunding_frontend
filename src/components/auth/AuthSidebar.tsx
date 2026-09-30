"use client";

import React from "react";
import { ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { Logo } from "../common/Logo";
import Link from "next/link";

const AuthSidebar = () => {
  return (
    <div className="hidden lg:flex w-[42%] flex-col justify-between border-r border-[var(--border)] bg-[var(--secondary)] p-10 transition-colors duration-300">
      <div className="space-y-10">
        <Link href="/">
          <Logo size={24} />
        </Link>

        <div className="space-y-8">
          <h2 className="text-3xl font-semibold text-[var(--text-main)] leading-tight tracking-tight">
            Powering the <br />
            <span className="text-[var(--primary)] text-3xl">
              Future of Funding
            </span>
          </h2>

          <ul className="space-y-5">
            <FeatureItem text="Support transparent campaigns with clear funding progress." />
            <FeatureItem text="Follow meaningful milestones and campaign updates." />
            <FeatureItem text="Manage your KEIBO account from one secure place." />
          </ul>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-[10px] font-semibold px-3 py-2 rounded-md bg-[var(--primary)] text-white w-fit">
          <Lock size={12} strokeWidth={2.5} />
          <span>KYC Secure</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-semibold px-3 py-2 rounded-md bg-emerald-700 text-white w-fit">
          <ShieldCheck size={12} strokeWidth={2.5} />
          <span>Smart Contract Audited</span>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex items-start gap-4">
    <div className="mt-0.5 w-5 h-5 rounded-md bg-[var(--primary)] text-white flex items-center justify-center shrink-0">
      <CheckCircle2 size={12} strokeWidth={2.5} />
    </div>
    <span className="text-sm font-medium text-[var(--text-muted)] leading-relaxed">
      {text}
    </span>
  </li>
);

export default AuthSidebar;
