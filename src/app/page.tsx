'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Globe, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 bg-[var(--card)] border-b border-[var(--border)] transition-colors duration-300">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-10">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[var(--secondary)] text-[var(--primary)] text-[10px] font-black uppercase tracking-[0.2em]"
                >
                  <Zap size={14} />
                  PROTOCOL V1.0 LIVE
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-4"
                >
                  <h1 className="typography_h1">
                    Fund real projects. <br />
                    <span className="text-[var(--primary)]">Empower innovators.</span>
                  </h1>
                  <p className="typography_body text-lg md:text-xl max-w-xl font-medium">
                    TruFund is a decentralized launchpad where visionary ideas meet the capital they deserve. 
                    Built on Celo for speed, transparency, and global reach.
                  </p>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-wrap gap-5"
                >
                  <Link href="/register" className="button_primary px-10 py-4.5 text-base flex items-center gap-2 shadow-2xl shadow-blue-500/20">
                    Get Started <ArrowRight size={18} />
                  </Link>
                  <Link href="/dashboard" className="button_secondary px-10 py-4.5 text-base border-2 border-[var(--primary)]/10 hover:border-[var(--primary)]">
                    Explore Projects
                  </Link>
                </motion.div>
              </div>

              <div className="hidden lg:grid grid-cols-2 gap-8">
                <StatNode label="Raised via Escrow" value="$4.2M" sub="24h +12%" />
                <StatNode label="Active Backers" value="15.8k" sub="Global Network" />
                <StatNode label="Projects Launched" value="142" sub="98% Success Rate" />
                <StatNode label="Security Audit" value="A+" sub="CertiK Verified" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-[var(--background)] transition-colors duration-300">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
              <h2 className="typography_h2">Why Choose TruFund?</h2>
              <p className="typography_body font-medium">Platform for secure, milestone-based crowdfunding.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              <FeatureNode 
                icon={<Shield />}
                title="On-Chain Escrow"
                desc="Funds are held in secure smart contracts and released only when milestones are verified by the community."
              />
              <FeatureNode 
                icon={<Globe />}
                title="Borderless Capital"
                desc="Launch or back projects from anywhere in the world. No banking limits, no borders, just innovation."
              />
              <FeatureNode 
                icon={<Users />}
                title="Direct Governance"
                desc="Backers are more than just funders—they are governance participants with voting rights on project path."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-[var(--card)] border-t border-[var(--border)] transition-colors duration-300">
          <div className="container mx-auto px-6">
            <div className="bg-[var(--primary)] rounded-[3rem] p-12 md:p-24 text-center space-y-10 relative overflow-hidden shadow-2xl shadow-blue-900/20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] -mr-48 -mt-48 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 blur-[100px] -ml-48 -mb-48 rounded-full"></div>
                
                <div className="relative z-10 space-y-4">
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                        Ready to lead the future?
                    </h2>
                    <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                        Join the next generation of innovators and backers. Your journey starts with a single transaction.
                    </p>
                </div>
                
                <div className="flex justify-center gap-6 relative z-10 pt-4">
                    <Link href="/register" className="bg-white text-[var(--primary)] font-black py-5 px-14 rounded-2xl hover:bg-gray-50 transition-all hover:scale-105 active:scale-95 shadow-xl">
                        CREATE ACCOUNT
                    </Link>
                </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

const StatNode = ({ label, value, sub }: { label: string, value: string, subText?: string, sub?: string }) => (
  <div className="card_base hover:translate-y-[-5px]">
    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
    <div className="flex items-baseline gap-2 mt-3">
        <p className="text-4xl font-black text-[var(--text-main)] tracking-tighter">{value}</p>
        <span className="text-[10px] font-bold text-emerald-500">{sub}</span>
    </div>
  </div>
);

const FeatureNode = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="card_base space-y-8 hover:border-[var(--primary)] group">
    <div className="w-16 h-16 rounded-[1.5rem] bg-[var(--secondary)] text-[var(--primary)] flex items-center justify-center border border-[var(--primary)]/5 group-hover:scale-110 transition-transform">
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 32 }) : icon}
    </div>
    <div className="space-y-3">
      <h3 className="text-2xl font-bold text-[var(--text-main)] transition-colors">{title}</h3>
      <p className="typography_body font-medium">{desc}</p>
    </div>
  </div>
);
