'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Upload, AlertCircle, ChevronRight, ChevronLeft, Target, Rocket, Globe } from 'lucide-react';
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
      setError(err.response?.data?.message || 'Failed to initialize project. Please verify connectivity.');
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl z-[101] overflow-hidden max-h-[90vh] flex flex-col border border-gray-100 dark:border-slate-800"
          >
            <div className="px-10 py-8 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                    <Rocket className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Launch Innovation</h2>
                    <div className="flex items-center gap-2">
                        {[1,2,3,4].map(s => (
                            <div key={s} className={`h-1 rounded-full transition-all duration-500 ${s === step ? 'w-6 bg-indigo-600' : 'w-2 bg-gray-100 dark:bg-slate-800'}`} />
                        ))}
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Step {step} of 4</span>
                    </div>
                  </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 p-10 overflow-y-auto custom-scrollbar space-y-8">
              {error && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-4 text-rose-600 dark:text-rose-400 text-sm font-bold italic"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  {error}
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Project Identity</label>
                      <input
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl py-4.5 px-6 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                        placeholder="e.g. Project Aurora"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Pitch Summary</label>
                      <textarea
                        name="summary"
                        required
                        rows={3}
                        value={formData.summary}
                        onChange={handleChange}
                        className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl py-4.5 px-6 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-medium resize-none"
                        placeholder="Elevator pitch for your project..."
                      />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Goal Amount ($)</label>
                        <div className="relative">
                            <Target className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                            <input
                                name="targetAmount"
                                type="number"
                                required
                                value={formData.targetAmount}
                                onChange={handleChange}
                                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl py-4.5 pl-12 pr-6 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-bold"
                                placeholder="50,000"
                            />
                        </div>
                        </div>
                        <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Industry</label>
                        <select
                            name="industry"
                            value={formData.industry}
                            onChange={handleChange}
                            className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl py-4.5 px-6 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-bold appearance-none cursor-pointer"
                        >
                            <option value="TECHNOLOGY">Technology</option>
                            <option value="FINTECH">Fintech</option>
                            <option value="SUSTAINABILITY">Sustainability</option>
                            <option value="HEALTHCARE">Healthcare</option>
                            <option value="CREATIVE">Creative</option>
                        </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Funding Model</label>
                      <div className="grid grid-cols-2 gap-4">
                          <button 
                            type="button" 
                            onClick={() => setFormData(f => ({ ...f, projectType: 'ROI' }))}
                            className={`p-5 rounded-[2rem] border-2 transition-all text-left space-y-2 ${formData.projectType === 'ROI' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-slate-800 bg-transparent'}`}
                          >
                              <div className={`w-3 h-3 rounded-full ${formData.projectType === 'ROI' ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'}`} />
                              <p className={`font-bold text-sm ${formData.projectType === 'ROI' ? 'text-indigo-600' : 'text-gray-500'}`}>Equity / Profit</p>
                              <p className="text-[10px] text-gray-400 leading-tight">Investors receive a share of profits or company equity.</p>
                          </button>
                           <button 
                            type="button" 
                            onClick={() => setFormData(f => ({ ...f, projectType: 'CHARITY' }))}
                            className={`p-5 rounded-[2rem] border-2 transition-all text-left space-y-2 ${formData.projectType === 'CHARITY' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-slate-800 bg-transparent'}`}
                          >
                              <div className={`w-3 h-3 rounded-full ${formData.projectType === 'CHARITY' ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'}`} />
                              <p className={`font-bold text-sm ${formData.projectType === 'CHARITY' ? 'text-indigo-600' : 'text-gray-500'}`}>Philanthropic</p>
                              <p className="text-[10px] text-gray-400 leading-tight">Donations based with social or environmental impact.</p>
                          </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">The Full Narrative</label>
                        <textarea
                            name="story"
                            required
                            rows={8}
                            value={formData.story}
                            onChange={handleChange}
                            className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-[2rem] py-6 px-8 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-medium resize-none leading-relaxed"
                            placeholder="Detail your operational roadmap, team expertise, and ultimate vision..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Operational Region</label>
                        <div className="relative">
                            <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl py-4.5 pl-12 pr-6 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                                placeholder="Global / Remote"
                            />
                        </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div 
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 border-2 border-dashed border-indigo-200 dark:border-indigo-900/40 rounded-[2.5rem] space-y-6">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Review Summary</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">{formData.name}</h3>
                            <p className="text-indigo-600 dark:text-indigo-400 font-bold text-2xl tracking-tight">${Number(formData.targetAmount).toLocaleString()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-indigo-500/5">
                                <p className="text-[10px] font-black text-gray-400 uppercase">Industry</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">{formData.industry.toLowerCase()}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-indigo-500/5">
                                <p className="text-[10px] font-black text-gray-400 uppercase">Model</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{formData.projectType}</p>
                            </div>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed italic line-clamp-3">"{formData.summary}"</p>
                    </div>

                    <div className="flex items-center gap-4 p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-500 font-semibold leading-snug">
                            By launching, you agree to our Protocol Terms and verify that all information provided is accurate for on-chain storage.
                        </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-6">
                {step > 1 ? (
                    <button
                        type="button"
                        onClick={prevStep}
                        className="flex items-center gap-2.5 px-8 py-4.5 rounded-2xl font-bold bg-gray-50 dark:bg-slate-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all border border-gray-100 dark:border-slate-800"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>
                ) : <div />}

                <button
                    disabled={isLoading}
                    className={`px-10 py-4.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-500/20 active:scale-95 min-w-[180px] ${step === 4 ? 'premium-gradient text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        {step === 4 ? 'Deploy to Protocol' : 'Continue'}
                        {step < 4 && <ChevronRight className="w-4 h-4" />}
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

export default CreateProjectModal;
