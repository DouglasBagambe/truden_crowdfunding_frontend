import React from 'react';
import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react';

const AuthSidebar = () => {
  return (
    <div className="hidden lg:flex w-[400px] flex-col justify-between bg-gradient-to-br from-[#eff6ff] to-[#e0e7ff] p-12 rounded-l-[2rem]">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-10 tracking-tight">
          Fund the Future
        </h1>
        
        <div className="space-y-8">
          <FeatureItem 
            text="Invest in vetted, high-potential deserving projects." 
          />
          <FeatureItem 
            text="Transparent, on-chain funding and milestone tracking." 
          />
          <FeatureItem 
            text="Join a community of innovators and investors." 
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 bg-[#e0f2fe] text-[#0369a1] px-4 py-2 rounded-xl w-fit">
          <Lock className="w-4 h-4" />
          <span className="text-sm font-semibold uppercase tracking-wider">KYC Secure</span>
        </div>
        
        <div className="flex items-center gap-2 bg-[#dcfce7] text-[#15803d] px-4 py-2 rounded-xl w-fit">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-sm font-semibold uppercase tracking-wider">Smart Contracts Audited</span>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-4 group">
    <CheckCircle2 className="w-6 h-6 text-[#10b981] mt-1 shrink-0 group-hover:scale-110 transition-transform" />
    <p className="text-lg text-gray-600 leading-snug">
      {text}
    </p>
  </div>
);

export default AuthSidebar;
