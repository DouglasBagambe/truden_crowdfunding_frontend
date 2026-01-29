'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, ArrowRight } from 'lucide-react';

interface ProjectCardProps {
  project: any;
  onClick?: () => void;
}

const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const raised = project.raisedAmount || 0;
  const target = project.targetAmount || 1000;
  const percentage = Math.min(Math.round((raised / target) * 100), 100);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      onClick={onClick}
      className="group flex flex-col bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-[var(--primary)] hover:translate-y-[-4px]"
    >
      {/* Image / Thumbnail Section */}
      <div className="h-44 relative overflow-hidden group">
        <div className="absolute inset-0 bg-black/5 dark:bg-black/20 group-hover:bg-transparent transition-colors z-10" />
        <div className="w-full h-full bg-[var(--background)] bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
             style={{ backgroundImage: `url(${project.coverImage || 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=2070&auto=format&fit=crop'})` }} 
        />
        <div className="absolute top-4 left-4 z-20">
            <span className="bg-[var(--card)]/90 backdrop-blur-md text-[var(--text-main)] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm border border-[var(--border)]">
                {project.category || 'INNOVATION'}
            </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-1 gap-6">
        <div className="space-y-2">
            <h3 className="font-bold text-lg text-[var(--text-main)] leading-tight line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                {project.name || project.title}
            </h3>
            <p className="text-sm text-[var(--text-muted)] font-medium line-clamp-2 leading-relaxed h-10">
                {project.summary || project.description}
            </p>
        </div>

        {/* Progress Section */}
        <div className="space-y-4">
            <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5 text-emerald-500">
                        <TrendingUp size={12} />
                        {percentage}% Funded
                    </span>
                    <span className="flex items-center gap-1.5 opacity-60">
                        <Clock size={12} />
                        23D LEFT
                    </span>
                </div>
                <div className="w-full bg-[var(--background)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
                    <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-[var(--primary)] rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    />
                </div>
            </div>
            
            <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Raised</p>
                    <p className="text-xl font-black text-[var(--text-main)] tracking-tight">${raised.toLocaleString()}</p>
                </div>
                <div className="text-right space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Goal</p>
                    <p className="text-sm font-bold text-[var(--text-main)] opacity-80">${target.toLocaleString()}</p>
                </div>
            </div>
        </div>

        {/* Action Reveal */}
        <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between group/btn">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">Back Project</span>
            <div className="w-9 h-9 rounded-xl bg-[var(--background)] text-[var(--text-muted)] flex items-center justify-center border border-[var(--border)] group-hover/btn:bg-[var(--primary)] group-hover/btn:text-white group-hover/btn:border-transparent transition-all transform group-hover:translate-x-1">
                <ArrowRight size={14} />
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
