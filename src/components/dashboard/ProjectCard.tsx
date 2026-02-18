'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import Link from 'next/link';

interface ProjectCardProps {
  project: {
    _id?: string;
    id?: string;
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
  const projectId = project._id || project.id;
  const projectName = project.name || project.title || 'Untitled Project';
  const raised = project.raisedAmount || 0;
  const goal = project.goalAmount || (project as any).targetAmount || 100000;
  const percentage = Math.min((raised / goal) * 100, 100);

  return (
    <Link href={`/explore/projects/${projectId}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        className="bg-[var(--card)] rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm hover:shadow-xl transition-all cursor-pointer group h-full flex flex-col"
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
              <div className="text-6xl opacity-20 italic font-black">TRUDEN</div>
            </div>
          )}

          {/* Project Type Badge */}
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${project.projectType === 'CHARITY'
                ? 'bg-rose-500 text-white'
                : 'bg-amber-500 text-white'
              }`}>
              {project.projectType === 'CHARITY' ? 'Charity' : 'ROI'}
            </span>
          </div>
        </div>

        {/* Project Details */}
        <div className="p-6 space-y-4 flex-grow flex flex-col">
          <div className="space-y-2 flex-grow">
            <h3 className="text-xl font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors line-clamp-1">
              {projectName}
            </h3>
            <p className="text-sm text-[var(--text-muted)] line-clamp-2 font-medium italic">
              {project.description || (project as any).summary || 'An innovative project making a difference in the community.'}
            </p>
          </div>

          {/* Progress Bar Container */}
          <div className="pt-4 border-t border-[var(--border)] mt-auto space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                <span className="text-[var(--primary)]">
                  UGX {raised.toLocaleString()}
                </span>
                <span className="text-[var(--text-muted)]">
                  {percentage.toFixed(0)}%
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
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">View Detail</span>
              <div className="w-8 h-8 rounded-full bg-[var(--secondary)] flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-white transition-all">
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}