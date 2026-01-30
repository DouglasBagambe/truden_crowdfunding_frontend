'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Mail, Globe, Landmark, Camera, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { userService } from '@/lib/user-service';
import { useAuth } from '@/hooks/useAuth';

interface KYCModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KYCModal({ isOpen, onClose }: KYCModalProps) {
  const { refetchUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    documentType: 'PASSPORT',
    documentCountry: 'US',
    dateOfBirth: '',
    homeAddress: {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US'
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await userService.submitKyc(formData);
      setIsSuccess(true);
      refetchUser();
      setTimeout(onClose, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification submission failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl z-[111] overflow-hidden border border-gray-100 dark:border-slate-800"
          >
            <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold dark:text-white">Trust & Identity</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-10">
              {isSuccess ? (
                <div className="text-center space-y-4 py-8">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold dark:text-white">Verification Pending</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                    Your identity documents were submitted successfully. Our compliance team will review them shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-6">
                    <header className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">KYC Verification</p>
                        <h3 className="text-2xl font-bold dark:text-white tracking-tight">Select Document Type</h3>
                    </header>

                    <div className="grid grid-cols-2 gap-4">
                        <DocumentTypeBtn 
                            active={formData.documentType === 'PASSPORT'} 
                            onClick={() => setFormData(f => ({ ...f, documentType: 'PASSPORT' }))}
                            label="Passport"
                            icon={<Globe className="w-4 h-4" />}
                        />
                        <DocumentTypeBtn 
                             active={formData.documentType === 'NATIONAL_ID'} 
                             onClick={() => setFormData(f => ({ ...f, documentType: 'NATIONAL_ID' }))}
                             label="National ID"
                             icon={<Landmark className="w-4 h-4" />}
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-slate-800">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Issuing Country</label>
                            <select 
                                value={formData.documentCountry}
                                onChange={(e) => setFormData(f => ({ ...f, documentCountry: e.target.value }))}
                                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
                            >
                                <option value="US">United States</option>
                                <option value="GB">United Kingdom</option>
                                <option value="KE">Kenya</option>
                                <option value="NG">Nigeria</option>
                                <option value="DE">Germany</option>
                            </select>
                        </div>

                        <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl flex items-center gap-5">
                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">Automated Scan</h4>
                                <p className="text-[11px] text-indigo-600/70 dark:text-indigo-400/70 font-medium leading-normal">
                                    We use biometric scanning to verify your identity. Ensure your document is clear.
                                </p>
                            </div>
                        </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                  )}

                  <button 
                    disabled={isLoading}
                    className="w-full premium-gradient text-white font-black text-sm uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Verification"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const DocumentTypeBtn = ({ active, onClick, label, icon }: any) => (
    <button 
        type="button"
        onClick={onClick}
        className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${active ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-gray-100 dark:border-slate-800 bg-transparent text-gray-400 hover:border-gray-200 dark:hover:border-slate-700'}`}
    >
        <div className={`p-2.5 rounded-xl ${active ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 transition-colors'}`}>
            {icon}
        </div>
        <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    </button>
);
