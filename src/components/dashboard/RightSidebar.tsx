import React from 'react';
import { motion } from 'framer-motion';

interface RightSidebarProps {
  onTriggerCreate?: () => void;
}

const RightSidebar = ({ onTriggerCreate }: RightSidebarProps) => {
  return (
    <div className="space-y-8">
      {/* DAO Proposals */}
      <div className="bg-gray-50/50 rounded-[2rem] p-6 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-6 flex items-center justify-between">
          DAO Proposals
          <span className="text-xs text-blue-600 font-bold cursor-pointer hover:underline">See all</span>
        </h3>
        
        <div className="space-y-4">
          <ProposalCard 
            title="Increase staking rewards" 
            desc="Proposal to increase rewards by 5%."
            status="Passing"
            timeLeft="Ends in 2 days"
          />
          <ProposalCard 
            title="Fund new marketing campaign" 
            desc="Allocate 10,000 tokens for marketing."
            status="Failing"
            timeLeft="Ends in 1 day"
          />
        </div>
      </div>

      {/* Submission CTA */}
      <div className="bg-[#1e3a8a] rounded-[2rem] p-8 text-center space-y-4 shadow-xl shadow-blue-100 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-400/30 transition-all"></div>
        <h3 className="text-white font-bold text-xl relative z-10">Have a project?</h3>
        <p className="text-blue-100 text-sm relative z-10">Submit your project to get funded by our community.</p>
        <button 
          onClick={onTriggerCreate}
          className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-4 rounded-2xl transition-all relative z-10"
        >
          Submit a Project
        </button>
      </div>

      {/* Trending Projects */}
      <div className="bg-gray-50/50 rounded-[2rem] p-6 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-6">Trending Projects</h3>
        <div className="space-y-6">
          <TrendingItem title="Tech Startup Incubator" raised="$900k" />
          <TrendingItem title="Educational Scholarship Fund" raised="$1.2M" />
        </div>
      </div>
    </div>
  );
};

const ProposalCard = ({ title, desc, status, timeLeft }: { title: string; desc: string; status: 'Passing' | 'Failing'; timeLeft: string }) => (
  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
    <h4 className="font-bold text-sm text-gray-900">{title}</h4>
    <p className="text-xs text-gray-500">{desc}</p>
    <div className="flex justify-between items-center pt-2">
      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${status === 'Passing' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
        {status}
      </span>
      <span className="text-[10px] text-gray-400 font-medium">{timeLeft}</span>
    </div>
  </div>
);

const TrendingItem = ({ title, raised }: { title: string; raised: string }) => (
  <div className="group cursor-pointer">
    <h4 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{title}</h4>
    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Raised: {raised}</p>
  </div>
);

export default RightSidebar;
