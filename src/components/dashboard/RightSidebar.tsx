import React from 'react';
import { motion } from 'framer-motion';
import { Vote, Zap, ShieldCheck, ChevronRight } from 'lucide-react';

interface RightSidebarProps {
  onTriggerCreate?: () => void;
}

const RightSidebar = ({ onTriggerCreate }: RightSidebarProps) => {
  return (
    <div className="space-y-10">
      {/* DAO Proposals */}
      <div className="glass-card rounded-[2.5rem] p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Vote className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">Governance</h3>
          </div>
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest px-3 py-1.5 rounded-full cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors">
            View All
          </span>
        </div>
        
        <div className="space-y-5">
          <ProposalCard 
            title="Increase staking rewards" 
            desc="Proposal to adjust APY for long-term holders."
            status="Passing"
            progress={82}
            timeLeft="2d left"
          />
          <ProposalCard 
            title="Marketing Fund v2" 
            desc="Allocate 50k tokens for global awareness."
            status="Failing"
            progress={34}
            timeLeft="1d left"
          />
        </div>
      </div>

      {/* Submission CTA - Premium Gradient Card */}
      <div className="premium-gradient rounded-[2.5rem] p-10 text-center space-y-6 shadow-2xl shadow-indigo-500/30 overflow-hidden relative group cursor-default">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -mr-32 -mt-32 rounded-full group-hover:bg-white/20 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-900/20 blur-[60px] -ml-24 -mb-24 rounded-full"></div>
        
        <div className="relative z-10 space-y-2">
          <Zap className="w-10 h-10 text-white mx-auto mb-4 animate-pulse" />
          <h3 className="text-white font-bold text-2xl tracking-tight leading-tight">Ready to Innovate?</h3>
          <p className="text-indigo-100 text-sm leading-relaxed opacity-80 font-medium">
            Join 350+ trailblazers getting funded by our global community.
          </p>
        </div>
        
        <button 
          onClick={onTriggerCreate}
          className="relative z-10 w-full bg-white text-indigo-600 font-black text-sm uppercase tracking-widest py-4 rounded-2xl hover:bg-indigo-50 transition-all active:scale-95 shadow-xl shadow-black/10"
        >
          Submit Project
        </button>
      </div>

      {/* Trust Badges / Info */}
      <div className="bg-gray-50/50 dark:bg-slate-900/50 rounded-[2.5rem] p-8 border border-gray-100 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Verified Security</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Escrow protected contracts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProposalCard = ({ title, desc, status, progress, timeLeft }: { title: string; desc: string; status: 'Passing' | 'Failing'; progress: number; timeLeft: string }) => (
  <div className="group bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all space-y-4">
    <div className="space-y-1">
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-[13px] text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">{title}</h4>
        <div className={`w-2 h-2 rounded-full ${status === 'Passing' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
      </div>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
    
    <div className="space-y-2">
      <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${status === 'Passing' ? 'bg-green-500' : 'bg-rose-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{timeLeft}</span>
        <span className={`text-[10px] font-black ${status === 'Passing' ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {progress}%
        </span>
      </div>
    </div>
  </div>
);

export default RightSidebar;
