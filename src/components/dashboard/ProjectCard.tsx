import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users } from 'lucide-react';

interface ProjectCardProps {
  title: string;
  description: string;
  raised: number;
  target: number;
  featured?: boolean;
  onClick?: () => void;
}

const ProjectCard = ({ title, description, raised, target, featured, onClick }: ProjectCardProps) => {
  const percentage = Math.min(Math.round((raised / target) * 100), 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      onClick={onClick}
      className={`group glass-card premium-shadow-hover rounded-[2rem] p-5 cursor-pointer flex flex-col h-full bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 ${featured ? 'w-[320px] shrink-0' : 'w-full'}`}
    >
      <div className="relative w-full h-44 rounded-2xl mb-5 overflow-hidden">
        {/* Placeholder for project image with overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20" />
        
        {featured && (
          <div className="absolute top-3 left-3 z-20 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
            Featured
          </div>
        )}
      </div>

      <div className="flex-1 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div className="relative h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full premium-gradient rounded-full"
          />
        </div>
        
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Raised</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">${raised.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{percentage}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
