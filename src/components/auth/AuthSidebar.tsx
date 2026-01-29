import React from 'react';
import { CheckCircle2, Lock, ShieldCheck, Sparkles } from 'lucide-react';

const AuthSidebar = () => {
  return (
    <div className="hidden lg:flex w-[420px] flex-col justify-between bg-slate-950 p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-[80px] -ml-24 -mb-24 rounded-full"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-bold italic text-xl">T</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              Truden
            </span>
        </div>

        <h1 className="text-5xl font-bold text-white mb-10 tracking-tight leading-tight">
          Shape the <span className="text-indigo-400">landscape</span> of tomorrow.
        </h1>
        
        <div className="space-y-10">
          <FeatureItem 
            text="Invest in vetted, high-potential projects through our decentralized launchpad." 
          />
          <FeatureItem 
            text="Real-time, on-chain milestone transparency and automated fund releases." 
          />
          <FeatureItem 
            text="Engage with a global collective of visionary innovators." 
          />
        </div>
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-5 py-2.5 rounded-2xl w-fit">
          <Lock className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">KYC Secure</span>
        </div>
        
        <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-5 py-2.5 rounded-2xl w-fit">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">Audited Protocol</span>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-4 group">
    <div className="p-1 bg-white/5 rounded-lg group-hover:bg-indigo-500/10 transition-colors">
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
    </div>
    <p className="text-base text-gray-400 leading-relaxed font-medium">
      {text}
    </p>
  </div>
);

export default AuthSidebar;
