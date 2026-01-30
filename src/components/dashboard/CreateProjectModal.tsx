'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle, ChevronRight, ChevronLeft, Target, Rocket, Globe } from 'lucide-react';
import { projectService } from '@/lib/project-service';
import { useQueryClient } from '@tanstack/react-query';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateProjectModal = ({ isOpen, onClose }: CreateProjectModalProps) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    summary: '',
    story: '',
    targetAmount: '',
    currency: 'USDC',
    projectType: 'ROI',
    industry: 'TECHNOLOGY',
    country: 'Global',
    beneficiary: 'Community',
    paymentMethod: 'Escrow'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
        nextStep();
        return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      await projectService.createProject({
        ...formData,
        targetAmount: Number(formData.targetAmount),
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      resetAndClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Protocol initialization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
      setStep(1);
      setFormData({
        name: '',
        summary: '',
        story: '',
        targetAmount: '',
        currency: 'USDC',
        projectType: 'ROI',
        industry: 'TECHNOLOGY',
        country: 'Global',
        beneficiary: 'Community',
        paymentMethod: 'Escrow'
      });
      onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-[#111] rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden max-h-[90vh] flex flex-col border border-gray-200 dark:border-[#262626]"
          >
            <div className="px-10 py-8 border-b border-gray-100 dark:border-[#262626] flex items-center justify-between sticky top-0 bg-white dark:bg-[#111] z-20">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--secondary)] text-[var(--primary)] rounded-xl border border-[var(--primary)]/10">
                    <Rocket size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">Launch on TruFund</h2>
                    <div className="flex items-center gap-2 mt-1">
                        {[1,2,3,4].map(s => (
                            <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-[var(--primary)]' : 'w-2 bg-gray-100 dark:bg-[#262626]'}`} />
                        ))}
                    </div>
                  </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 p-10 overflow-y-auto space-y-8 scrollbar-hide">
              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-4 text-rose-600 dark:text-rose-400 text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Project Name</label>
                      <input
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="input_field"
                        placeholder="Project Aurora"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Elevator Summary</label>
                      <textarea
                        name="summary"
                        required
                        rows={3}
                        value={formData.summary}
                        onChange={handleChange}
                        className="input_field h-32 resize-none"
                        placeholder="Catchy one-liner about your project..."
                      />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Target Funding ($)</label>
                            <div className="relative">
                                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--primary)]" />
                                <input
                                    name="targetAmount"
                                    type="number"
                                    required
                                    value={formData.targetAmount}
                                    onChange={handleChange}
                                    className="input_field pl-12 font-bold"
                                    placeholder="100,000"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Industry</label>
                            <select
                                name="industry"
                                value={formData.industry}
                                onChange={handleChange}
                                className="input_field font-bold appearance-none cursor-pointer"
                            >
                                <option value="TECHNOLOGY">Technology</option>
                                <option value="FINTECH">Fintech</option>
                                <option value="SUSTAINABILITY">Sustainability</option>
                                <option value="CREATIVE">Creative</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Project Type</label>
                      <div className="grid grid-cols-2 gap-4">
                          <OptionButton 
                            active={formData.projectType === 'ROI'} 
                            onClick={() => setFormData(f => ({ ...f, projectType: 'ROI' }))}
                            label="Equity/Return"
                            desc="Financial returns for backers."
                          />
                           <OptionButton 
                            active={formData.projectType === 'CHARITY'} 
                            onClick={() => setFormData(f => ({ ...f, projectType: 'CHARITY' }))}
                            label="Philanthropic"
                            desc="Donation based impact."
                          />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Project Roadmap & Story</label>
                        <textarea
                            name="story"
                            required
                            rows={8}
                            value={formData.story}
                            onChange={handleChange}
                            className="input_field h-48 resize-none py-4 leading-relaxed"
                            placeholder="Detail your goals, team, and how the funds will be used..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Operational Region</label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            <input
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="input_field pl-12"
                                placeholder="Global"
                            />
                        </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div 
                    key="step4"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                  >
                    <div className="p-8 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626] rounded-[2rem] space-y-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">Review Project</p>
                            <h3 className="text-3xl font-bold text-[var(--text-main)] tracking-tight line-clamp-1">{formData.name}</h3>
                            <p className="text-xl font-bold opacity-80">${Number(formData.targetAmount).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white dark:bg-[#111] px-4 py-2 rounded-xl border border-gray-100 dark:border-[#262626] text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                {formData.industry}
                            </div>
                            <div className="bg-white dark:bg-[#111] px-4 py-2 rounded-xl border border-gray-100 dark:border-[#262626] text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                {formData.projectType}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center gap-4 text-amber-700 dark:text-amber-500 text-xs font-bold leading-snug">
                        <AlertCircle size={20} className="shrink-0" />
                        <span>Launching creates an on-chain record. Ensure all details are final and accurate.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-6 border-t border-gray-100 dark:border-[#262626] flex items-center justify-between gap-6">
                {step > 1 ? (
                    <button
                        type="button"
                        onClick={prevStep}
                        className="button_secondary py-3.5 px-8 flex items-center gap-2"
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>
                ) : <div />}

                <button
                    disabled={isLoading}
                    className="button_primary py-3.5 px-10 flex items-center gap-3 min-w-[180px] justify-center"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                      <>
                        {step === 4 ? 'Deploy Project' : 'Continue'}
                        {step < 4 && <ChevronRight size={16} />}
                      </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const OptionButton = ({ active, onClick, label, desc }: any) => (
    <button 
        type="button" 
        onClick={onClick}
        className={`p-5 rounded-2xl border-2 transition-all text-left space-y-2 flex-1 ${
            active 
            ? 'border-[var(--primary)] bg-[var(--secondary)]' 
            : 'border-gray-100 dark:border-[#262626] bg-transparent'
        }`}
    >
        <p className={`font-bold text-sm ${active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>{label}</p>
        <p className="text-[10px] text-[var(--text-muted)] leading-tight font-medium">{desc}</p>
    </button>
);

export default CreateProjectModal;
