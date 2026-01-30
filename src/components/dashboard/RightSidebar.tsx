'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Vote, Zap, ShieldCheck } from 'lucide-react';

interface RightSidebarProps {
  onTriggerCreate?: () => void;
}

const RightSidebar = ({ onTriggerCreate }: RightSidebarProps) => {
  return (
    <div className="space-y-8">
      {/* Governance Card */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#262626] p-8 space-y-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[var(--secondary)] text-[var(--primary)] rounded-lg">
                <Vote size={18} />
            </div>
            <h3 className="font-bold text-[var(--text-main)]">Active Votes</h3>
          </div>
          <button className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] hover:underline">View Hub</button>
        </div>
        
        <div className="space-y-6">
          <ProposalNode 
            title="Adjust APY Multiplier" 
            desc="Impacts long-term staking pools."
            status="Passing"
            progress={82}
          />
          <ProposalNode 
            title="New Listing: SolX" 
            desc="Solar energy tech proposal."
            status="Failing"
            progress={24}
          />
        </div>
      </div>

      {/* Submission CTA */}
      <div className="bg-[var(--primary)] rounded-2xl p-10 text-center space-y-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-2xl -mr-24 -mt-24 rounded-full" />
        
        <div className="relative z-10 space-y-2">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Zap className="text-white" size={24} />
          </div>
          <h3 className="text-white font-bold text-2xl tracking-tight">Got a Vision?</h3>
          <p className="text-indigo-100 text-sm font-medium leading-relaxed">
            Submit your project and get funded by a global network of backers.
          </p>
        </div>
        
        <button 
          onClick={onTriggerCreate}
          className="relative z-10 w-full bg-white text-[var(--primary)] font-bold py-4 rounded-xl hover:bg-gray-100 transition-all active:scale-95"
        >
          SUBMIT PROJECT
        </button>
      </div>

      {/* Verified Info */}
      <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl p-6 border border-gray-200 dark:border-[#333] flex items-center gap-4">
        <div className="p-2.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#262626] rounded-xl text-emerald-600">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h4 className="font-bold text-sm">Escrow Protected</h4>
          <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Audited Smart Contracts</p>
        </div>
      </div>
    </div>
  );
};

const ProposalNode = ({ title, desc, status, progress }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between items-start">
        <div>
            <h4 className="font-bold text-sm text-[var(--text-main)]">{title}</h4>
            <p className="text-xs text-[var(--text-muted)] font-medium">{desc}</p>
        </div>
        <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider ${
            status === 'Passing' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
            {status}
        </span>
    </div>
    <div className="space-y-1.5">
        <div className="h-1.5 w-full bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
            <div 
                className={`h-full rounded-full transition-all duration-1000 ${status === 'Passing' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${progress}%` }}
            />
        </div>
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            <span>Progress</span>
            <span>{progress}%</span>
        </div>
    </div>
  </div>
);

export default RightSidebar;
