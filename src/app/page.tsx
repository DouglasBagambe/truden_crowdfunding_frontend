'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Zap, Globe, Users, ArrowRight, TrendingUp, BarChart3, Lock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-indigo-100 dark:selection:bg-indigo-900/40">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -z-10" />
        <div className="max-w-7xl mx-auto px-6 text-center space-y-10">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 px-5 py-2 rounded-full"
            >
                <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Next Gen Decentralized Funding</span>
            </motion.div>

            <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-7xl md:text-8xl font-bold tracking-tighter leading-[0.9]"
            >
                Finance the <br /> <span className="premium-text-gradient">Unstoppable.</span>
            </motion.h1>

            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed"
            >
                Truden is the world's first high-integrity crowdfunding protocol. 
                Transparent on-chain milestones meet institutional-grade security.
            </motion.p>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8"
            >
                <Link 
                    href="/dashboard" 
                    className="w-full sm:w-auto premium-gradient text-white font-black text-sm uppercase tracking-widest px-12 py-5 rounded-2xl shadow-2xl shadow-indigo-500/20 hover:scale-105 transition-transform active:scale-95"
                >
                    Launch App
                </Link>
                <Link 
                    href="/register" 
                    className="w-full sm:w-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 font-black text-sm uppercase tracking-widest px-12 py-5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    Create Account
                </Link>
            </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <FeatureItem 
                    icon={<Shield className="w-8 h-8" />}
                    title="On-Chain Escrow"
                    description="Funds are locked in smart contracts and only released upon community-verified milestone completion."
                  />
                  <FeatureItem 
                    icon={<Globe className="w-8 h-8" />}
                    title="Borderless Capital"
                    description="Access global liquidity instantly. No geographical barriers, no intermediaries, just direct value."
                  />
                  <FeatureItem 
                    icon={<Users className="w-8 h-8" />}
                    title="DAO Governance"
                    description="Investors hold voting power. Decide the future of projects you fund with transparent governance tokens."
                  />
              </div>
          </div>
      </section>

      {/* Trust Section */}
      <section className="py-32 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-8">
                  <h2 className="text-5xl font-bold tracking-tight leading-tight">Built on the foundation of <br /> <span className="text-indigo-600">Absolute Trust.</span></h2>
                  <div className="space-y-6">
                      <TrustPoint icon={<Lock />} title="Institutional Security" desc="Audited contracts and multi-sig treasury management." />
                      <TrustPoint icon={<BarChart3 />} title="Real-time Analytics" desc="Track every dollar and milestone in real-time on-scan." />
                      <TrustPoint icon={<TrendingUp />} title="Yield Incentives" desc="Earn reputation and yield and early backer rewards." />
                  </div>
              </div>
              <div className="relative">
                  <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl rounded-full" />
                  <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[3rem] shadow-2xl">
                      <div className="space-y-6">
                          <div className="flex justify-between items-center">
                              <h4 className="font-bold">Live Fundings</h4>
                              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full">Secure</div>
                          </div>
                          {[1,2,3].map(i => (
                              <div key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl" />
                                  <div className="flex-1 space-y-2">
                                      <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-indigo-600 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
          <div className="max-w-5xl mx-auto px-6 text-center space-y-8 relative z-10">
              <h2 className="text-5xl font-bold text-white tracking-tight">Ready to build the future?</h2>
              <p className="text-indigo-100 text-lg font-medium opacity-80 max-w-xl mx-auto">
                  Join thousands of innovators and investors who are already shaping the decentralized landscape.
              </p>
              <div className="pt-6">
                  <Link href="/register" className="bg-white text-indigo-600 font-black text-sm uppercase tracking-widest px-12 py-5 rounded-2xl shadow-xl hover:scale-105 transition-transform inline-block">
                      Start Your Legacy
                  </Link>
              </div>
          </div>
      </section>

      <Footer />
    </div>
  );
}

const FeatureItem = ({ icon, title, description }: any) => (
    <div className="space-y-6 p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            {icon}
        </div>
        <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                {description}
            </p>
        </div>
    </div>
);

const TrustPoint = ({ icon, title, desc }: any) => (
    <div className="flex gap-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 h-fit">
            {React.cloneElement(icon, { size: 20 })}
        </div>
        <div>
            <h4 className="font-bold text-lg mb-0.5">{title}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{desc}</p>
        </div>
    </div>
);
