import React from 'react';
import AuthSidebar from './AuthSidebar';
import { motion } from 'framer-motion';

interface AuthCardProps {
  children: React.ReactNode;
}

const AuthCard = ({ children }: AuthCardProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex w-full max-w-[1100px] h-[720px] bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl shadow-indigo-500/10 overflow-hidden border border-gray-100 dark:border-slate-800"
      >
        <AuthSidebar />
        <div className="flex-1 p-12 lg:p-20 flex flex-col justify-center overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthCard;
