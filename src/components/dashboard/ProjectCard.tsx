'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const projectName = project.name || project.title || 'Untitled Project';
  const raised = project.raisedAmount || 0;
  const goal = project.goalAmount || (project as any).targetAmount || 100000;
  const percentage = Math.min((raised / goal) * 100, 100);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Safety check: ensure project ID exists before navigating
      const projectId = project.id || project._id;
      if (!projectId) {
        console.error('[ProjectCard] Cannot navigate: Project ID is undefined', project);
        return;
      }
      router.push(`/explore/${projectId}`);
    }
  };

  const isCharity = project.projectType === 'CHARITY';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-2xl overflow-hidden border transition-all cursor-pointer group shadow-sm hover:shadow-xl ${
        isCharity 
          ? 'border-gray-200 hover:border-rose-200' 
          : 'border-gray-200 hover:border-emerald-200'
      }`}
      onClick={handleClick}
    >
      {/* Project Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {project.imageUrl ? (
          <img 
            src={project.imageUrl} 
            alt={projectName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <span className="text-6xl grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-40 transition-all duration-500">
              {isCharity ? '❤️' : '📈'}
            </span>
          </div>
        )}
        
        {/* Project Type Badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg backdrop-blur-md ${
            isCharity 
              ? 'bg-rose-500/90 text-white' 
              : 'bg-emerald-500/90 text-white'
          }`}>
            {isCharity ? 'Impact / Charity' : 'Investment / ROI'}
          </span>
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
      {/* Project Details */}
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isCharity ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {isCharity ? 'Community Support' : 'Capital Growth'}
            </span>
          </div>
          <h3 className={`text-xl font-bold text-gray-900 line-clamp-1 transition-colors ${
            isCharity ? 'group-hover:text-rose-600' : 'group-hover:text-emerald-600'
          }`}>
            {projectName}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed font-medium">
            {project.description || 'Contribute to this innovative project and help make a real-world difference.'}
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
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Raised So Far</p>
              <p className={`text-lg font-black ${isCharity ? 'text-rose-600' : 'text-emerald-600'}`}>
                ${raised.toLocaleString()}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Target Goal</p>
              <p className="text-sm font-bold text-gray-600">
                ${goal.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: `${percentage}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className={`h-full rounded-full ${
                isCharity ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
            />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center pt-1">
            {Math.round(percentage)}% of target reached
          </p>
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
        {/* Action Button */}
        <div className="pt-2 border-t border-gray-100">
          <button className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md group-hover:shadow-lg ${
            isCharity 
              ? 'bg-rose-600 text-white hover:bg-rose-700' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}>
            {isCharity ? 'Support This Cause' : 'Invest in Growth'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}