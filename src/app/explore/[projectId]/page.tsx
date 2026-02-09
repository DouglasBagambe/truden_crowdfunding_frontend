'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, TrendingUp, Users, Shield,
  Clock, Target, Award, MapPin, Globe, Share2,
  Heart, CheckCircle, AlertCircle, ExternalLink
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MultiStepInvestModal from '@/components/dashboard/MultiStepInvestModal';
import { projectService } from '@/lib/project-service';
import { useAuth } from '@/hooks/useAuth';

import { useInvestmentNFT } from '@/hooks/useInvestmentNFT';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { isAuthenticated } = useAuth();
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);

  // Early return if projectId is undefined or invalid
  if (!projectId || projectId === 'undefined') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-bold text-[var(--text-main)]">Invalid Project Link</h2>
          <p className="text-[var(--text-muted)]">The project ID is missing or invalid.</p>
          <button onClick={() => router.push('/explore')} className="button_primary">
            Back to Explorer
          </button>
        </div>
      </div>
    );
  }

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProject(projectId),
    enabled: !!projectId && projectId !== 'undefined',
  });

  // Check NFT ownership
  const { hasInvestment, balance } = useInvestmentNFT(project?.projectOnchainId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[var(--text-muted)] font-bold">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-bold text-[var(--text-main)]">Project Not Found</h2>
          <button onClick={() => router.push('/explore')} className="button_primary">
            Back to Explorer
          </button>
        </div>
      </div>
    );
  }

  const raised = project.raisedAmount || 0;
  const goal = project.goalAmount || project.targetAmount || 100000;
  const percentage = Math.min((raised / goal) * 100, 100);
  const daysLeft = project.deadline 
    ? Math.max(0, Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 30;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <main className="pt-24 pb-24">
        {/* Hero Section */}
        <div className="container mx-auto px-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors mb-6 font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Project Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Project Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                    project.projectType === 'CHARITY'
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}>
                    {project.projectType === 'CHARITY' ? 'Charity' : 'ROI Investment'}
                  </span>
                  <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400">
                    {project.status || 'Active'}
                  </span>
                  
                  {/* NFT Ownership Badge */}
                  {hasInvestment && (
                    <motion.span 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center gap-1 shadow-lg shadow-purple-500/20"
                    >
                      <Award className="w-3 h-3" />
                      Investor • {balance} NFT{balance > 1 ? 's' : ''} Owned
                    </motion.span>
                  )}
                </div>

                <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-main)] leading-tight">
                  {project.name || project.title}
                </h1>

                <p className="text-xl text-[var(--text-muted)] font-medium">
                  {project.summary || project.description}
                </p>

                {/* Creator Info */}
                <div className="flex items-center gap-4 pt-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {project.creator?.name?.[0] || 'C'}
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-muted)] font-medium">Created by</p>
                    <p className="font-bold text-[var(--text-main)]">{project.creator?.name || 'Anonymous Creator'}</p>
                  </div>
                </div>
              </div>

              {/* Project Image/Video */}
              <div className="relative h-96 bg-[var(--secondary)] rounded-3xl overflow-hidden border border-[var(--border)]">
                {project.imageUrl || project.media?.[0] ? (
                  <img
                    src={project.imageUrl || project.media?.[0]}
                    alt={project.name || project.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-9xl opacity-10">🚀</div>
                  </div>
                )}
              </div>

              {/* Funding Timeline */}
              <FundingTimeline project={project} />

              {/* Project Story */}
              <div className="bg-[var(--card)] rounded-3xl p-8 border border-[var(--border)]">
                <h2 className="text-2xl font-bold text-[var(--text-main)] mb-6">The Story</h2>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-[var(--text-muted)] leading-relaxed whitespace-pre-line">
                    {project.story || project.description || 'No story available yet.'}
                  </p>
                </div>
              </div>

              {/* Use of Funds */}
              {project.useOfFunds && project.useOfFunds.length > 0 && (
                <div className="bg-[var(--card)] rounded-3xl p-8 border border-[var(--border)]">
                  <h2 className="text-2xl font-bold text-[var(--text-main)] mb-6">Use of Funds</h2>
                  <div className="space-y-4">
                    {project.useOfFunds.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[var(--secondary)] rounded-xl flex items-center justify-center">
                            <Target className="w-5 h-5 text-[var(--primary)]" />
                          </div>
                          <div>
                            <p className="font-bold text-[var(--text-main)]">{item.item || item.category}</p>
                            <p className="text-xs text-[var(--text-muted)]">{item.percentage}% of total</p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-[var(--primary)]">
                          ${(item.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team/Creator Details */}
              <div className="bg-[var(--card)] rounded-3xl p-8 border border-[var(--border)]">
                <h2 className="text-2xl font-bold text-[var(--text-main)] mb-6">About the Creator</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                      {project.creator?.name?.[0] || 'C'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-main)]">
                        {project.creator?.name || 'Anonymous Creator'}
                      </h3>
                      <p className="text-sm text-[var(--text-muted)]">
                        {project.creator?.bio || 'Entrepreneur & Innovator'}
                      </p>
                    </div>
                  </div>
                  {project.website && (
                    <a
                      href={project.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[var(--primary)] hover:underline font-bold"
                    >
                      <Globe className="w-4 h-4" />
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Investment Card (Sticky) */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                <InvestmentCard
                  project={project}
                  raised={raised}
                  goal={goal}
                  percentage={percentage}
                  daysLeft={daysLeft}
                  onInvest={() => setIsInvestModalOpen(true)}
                  isAuthenticated={isAuthenticated}
                  hasInvestment={hasInvestment}
                />

                {/* Recent Backers */}
                <div className="bg-[var(--card)] rounded-3xl p-6 border border-[var(--border)]">
                  <h3 className="text-lg font-bold text-[var(--text-main)] mb-4">Recent Backers</h3>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[var(--text-main)]">Backer #{i}</p>
                          <p className="text-xs text-[var(--text-muted)]">Contributed 50 CELO</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Investment Modal */}
      <MultiStepInvestModal
        isOpen={isInvestModalOpen}
        onClose={() => setIsInvestModalOpen(false)}
        project={project}
      />
    </div>
  );
}

// Investment Card Component
const InvestmentCard = ({ project, raised, goal, percentage, daysLeft, onInvest, isAuthenticated, hasInvestment }: any) => (
  <div className="bg-[var(--card)] rounded-3xl p-8 border-2 border-[var(--border)] shadow-2xl relative overflow-hidden">
    {hasInvestment && (
      <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-bl-xl">
        Backed
      </div>
    )}

    {/* Progress */}
    <div className="space-y-4 mb-6">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-3xl font-black text-[var(--primary)]">
            ${raised.toLocaleString()}
          </p>
          <p className="text-sm text-[var(--text-muted)] font-medium">
            raised of ${goal.toLocaleString()} goal
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[var(--text-main)]">{Math.round(percentage)}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 dark:bg-[#1a1a1a] rounded-full h-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
        />
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-[var(--secondary)] rounded-2xl p-4 text-center">
        <p className="text-2xl font-bold text-[var(--text-main)]">{project.backerCount || 0}</p>
        <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Backers</p>
      </div>
      <div className="bg-[var(--secondary)] rounded-2xl p-4 text-center">
        <p className="text-2xl font-bold text-[var(--text-main)]">{daysLeft}</p>
        <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Days Left</p>
      </div>
    </div>

    {/* CTA Button */}
    <button
      onClick={onInvest}
      disabled={!isAuthenticated}
      className={`w-full py-5 mb-4 shadow-xl flex items-center justify-center gap-3 transition-all ${
        hasInvestment 
          ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20 rounded-2xl' 
          : 'button_primary'
      }`}
    >
      <Heart className={`w-5 h-5 ${hasInvestment ? 'fill-current' : ''}`} />
      <span className="font-bold">
        {!isAuthenticated 
          ? 'Sign In to Invest' 
          : hasInvestment 
            ? 'Invest Again' 
            : 'Back This Project'}
      </span>
    </button>

    {/* Trust Badges */}
    <div className="space-y-2 pt-4 border-t border-[var(--border)]">
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Shield className="w-4 h-4 text-green-500" />
        <span className="font-medium">Protected by Smart Contract Escrow</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <CheckCircle className="w-4 h-4 text-blue-500" />
        <span className="font-medium">Milestone-Based Fund Release</span>
      </div>
    </div>
  </div>
);

// Funding Timeline Component
const FundingTimeline = ({ project }: any) => {
  const milestones = project.milestones || [
    { title: 'Project Launch', amount: 25, dueDate: '2026-02-15', status: 'Completed' },
    { title: 'Development Phase 1', amount: 35, dueDate: '2026-03-01', status: 'In Progress' },
    { title: 'Beta Testing', amount: 20, dueDate: '2026-03-15', status: 'Pending' },
    { title: 'Final Delivery', amount: 20, dueDate: '2026-04-01', status: 'Pending' },
  ];

  return (
    <div className="bg-[var(--card)] rounded-3xl p-8 border border-[var(--border)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-main)]">Funding Timeline</h2>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Calendar className="w-4 h-4" />
          <span className="font-bold">{milestones.length} Milestones</span>
        </div>
      </div>

      <div className="relative space-y-6">
        {milestones.map((milestone: any, index: number) => {
          const isCompleted = milestone.status === 'Completed';
          const isInProgress = milestone.status === 'In Progress';
          const isPending = milestone.status === 'Pending';

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative flex gap-6"
            >
              {/* Timeline Line */}
              {index < milestones.length - 1 && (
                <div className="absolute left-6 top-14 w-0.5 h-full bg-gray-200 dark:bg-[#262626]"></div>
              )}

              {/* Status Icon */}
              <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                isCompleted 
                  ? 'bg-green-500' 
                  : isInProgress 
                  ? 'bg-blue-500 animate-pulse' 
                  : 'bg-gray-200 dark:bg-[#262626]'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : isInProgress ? (
                  <Clock className="w-6 h-6 text-white" />
                ) : (
                  <Award className="w-6 h-6 text-gray-400" />
                )}
              </div>

              {/* Milestone Content */}
              <div className="flex-1 bg-[var(--secondary)] rounded-2xl p-6 border border-[var(--border)]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-main)]">{milestone.title}</h3>
                    <p className="text-sm text-[var(--text-muted)] font-medium">
                      Due: {new Date(milestone.dueDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isCompleted ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                    isInProgress ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' :
                    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {milestone.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)] font-bold">Release Amount</span>
                  <span className="text-xl font-bold text-[var(--primary)]">
                    {milestone.amount}% (${((project.goalAmount || 100000) * milestone.amount / 100).toLocaleString()})
                  </span>
                </div>

                {/* Progress bar for in-progress milestones */}
                {isInProgress && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 dark:bg-[#1a1a1a] rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '60%' }}
                        transition={{ duration: 1 }}
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">60% Complete</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
