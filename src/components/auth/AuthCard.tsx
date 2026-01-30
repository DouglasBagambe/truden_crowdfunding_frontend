'use client';

import React from 'react';
import AuthSidebar from './AuthSidebar';
import { motion } from 'framer-motion';

interface AuthCardProps {
  children: React.ReactNode;
}

const AuthCard = ({ children }: AuthCardProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)] transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex w-full max-w-[1000px] min-h-[640px] bg-[var(--card)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--border)]"
      >
        <AuthSidebar />
        <div className="flex-1 p-8 lg:p-14 flex flex-col justify-center">
            <div className="w-full max-w-sm mx-auto">
                {children}
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthCard;
