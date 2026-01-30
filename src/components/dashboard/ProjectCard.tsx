'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: string;
    name?: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    raisedAmount?: number;
    goalAmount?: number;
    projectType?: 'CHARITY' | 'ROI';
  };
  onClick?: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const projectName = project.name || project.title || 'Untitled Project';
  const raised = project.raisedAmount || 0;
  const goal = project.goalAmount || 100000;
  const percentage = Math.min((raised / goal) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="bg-[var(--card)] rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm hover:shadow-xl transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Project Image */}
      <div className="relative h-48 bg-[var(--secondary)] overflow-hidden">
        {project.imageUrl ? (
          <img 
            src={project.imageUrl} 
            alt={projectName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl opacity-20">🚀</div>
          </div>
        )}
        
        {/* Project Type Badge */}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            project.projectType === 'CHARITY' 
              ? 'bg-rose-500 text-white' 
              : 'bg-amber-500 text-white'
          }`}>
            {project.projectType === 'CHARITY' ? 'Charity' : 'ROI'}
          </span>
        </div>
      </div>

      {/* Project Details */}
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">
            {projectName}
          </h3>
          <p className="text-sm text-[var(--text-muted)] line-clamp-2">
            {project.description || 'An innovative project making a difference in the community.'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-bold text-[var(--primary)]">
              ${raised.toLocaleString()} Raised
            </span>
            <span className="text-[var(--text-muted)]">
              ${goal.toLocaleString()} Goal
            </span>
          </div>
          <div className="w-full bg-[var(--secondary)] rounded-full h-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: `${percentage}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-[var(--primary)] rounded-full"
            />
          </div>
        </div>

        {/* View Details Button */}
        <button className="button_primary w-full mt-4 flex items-center justify-center gap-2 group-hover:gap-3">
          View Details
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}