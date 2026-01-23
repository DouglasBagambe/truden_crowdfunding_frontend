import React from 'react';
import AuthSidebar from './AuthSidebar';
import { motion } from 'framer-motion';

interface AuthCardProps {
  children: React.ReactNode;
}

const AuthCard = ({ children }: AuthCardProps) => {
  return (
    <div className="min-height-screen flex items-center justify-center p-6 bg-slate-50 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-[1000px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden"
      >
        <AuthSidebar />
        <div className="flex-1 p-8 lg:p-14 flex flex-col justify-center">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthCard;
