'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, Users, Clock, CheckCircle, 
  AlertCircle, Heart, Share2, Bookmark
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MultiStepInvestModal from '@/components/dashboard/MultiStepInvestModal';
import { projectService } from '@/lib/project-service';
import { useAuth } from '@/hooks/useAuth';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { isAuthenticated } = useAuth();
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'story' | 'timeline' | 'updates' | 'comments'>('story');

  // Early return if projectId is undefined or invalid
  if (!projectId || projectId === 'undefined') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Invalid Project Link</h2>
          <p className="text-gray-600">The project ID is missing or invalid.</p>
          <button 
            onClick={() => router.push('/explore')} 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Projects
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Project Not Found</h2>
          <p className="text-gray-600">This project doesn't exist or has been removed.</p>
          <button 
            onClick={() => router.push('/explore')} 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const raised = project.raisedAmount || 0;
  const goal = project.goalAmount || project.targetAmount || 100000;
  const percentage = Math.min((raised / goal) * 100, 100);
  const backerCount = project.backerCount || 0;
  const daysLeft = project.deadline 
    ? Math.max(0, Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 30;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>

          {/* Project Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded text-xs font-medium ${
                    project.projectType === 'CHARITY'
                      ? 'bg-pink-100 text-pink-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {project.projectType === 'CHARITY' ? 'Charity' : 'ROI Project'}
                  </span>
                  <span className="px-3 py-1 rounded bg-green-100 text-green-700 text-xs font-medium">
                    {project.status || 'Active'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Created: {new Date(project.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {project.name || project.title}
                </h1>
                <p className="text-gray-600 leading-relaxed">
                  {project.summary || project.description}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-6">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bookmark className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Creator Info */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {project.creator?.name?.[0] || 'C'}
              </div>
              <div>
                <p className="text-sm text-gray-500">by</p>
                <p className="font-semibold text-gray-900">{project.creator?.name || 'Anonymous Creator'}</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Project Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Image */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {project.imageUrl || project.media?.[0] ? (
                  <img
                    src={project.imageUrl || project.media?.[0]}
                    alt={project.name || project.title}
                    className="w-full h-96 object-cover"
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
                    <div className="text-6xl opacity-20">🚀</div>
                  </div>
                )}
              </div>

              {/* Funding Progress */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Invested</p>
                      <p className="text-3xl font-bold text-gray-900">${raised.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Goal</p>
                      <p className="text-lg font-semibold text-gray-900">${goal.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-blue-600 rounded-full"
                    />
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">{Math.round(percentage)}% funded</span>
                    {' • '}
                    <span className="font-semibold">{backerCount}</span> backers
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                  <div className="flex">
                    <TabButton 
                      active={activeTab === 'story'} 
                      onClick={() => setActiveTab('story')}
                    >
                      Details
                    </TabButton>
                    <TabButton 
                      active={activeTab === 'timeline'} 
                      onClick={() => setActiveTab('timeline')}
                    >
                      Timeline
                    </TabButton>
                    <TabButton 
                      active={activeTab === 'updates'} 
                      onClick={() => setActiveTab('updates')}
                    >
                      Updates
                    </TabButton>
                    <TabButton 
                      active={activeTab === 'comments'} 
                      onClick={() => setActiveTab('comments')}
                    >
                      Comments
                    </TabButton>
                  </div>
                </div>

                <div className="p-6">
                  {activeTab === 'story' && <ProjectStory project={project} />}
                  {activeTab === 'timeline' && <ProjectTimeline project={project} />}
                  {activeTab === 'updates' && <ProjectUpdates />}
                  {activeTab === 'comments' && <ProjectComments />}
                </div>
              </div>
            </div>

            {/* Right Column - Investment Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <InvestmentCard
                  project={project}
                  raised={raised}
                  goal={goal}
                  percentage={percentage}
                  daysLeft={daysLeft}
                  backerCount={backerCount}
                  onInvest={() => setIsInvestModalOpen(true)}
                  isAuthenticated={isAuthenticated}
                />
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

// Tab Button Component
const TabButton = ({ active, onClick, children }: any) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
      active
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-600 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
);

// Investment Card Component
const InvestmentCard = ({ 
  project, raised, goal, percentage, daysLeft, backerCount, onInvest, isAuthenticated 
}: any) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
    <button
      onClick={onInvest}
      disabled={!isAuthenticated}
      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
    >
      {isAuthenticated ? 'Invest Now' : 'Sign In to Invest'}
    </button>

    <button className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2">
      <Heart className="w-4 h-4" />
      Save
    </button>

    <div className="pt-6 border-t border-gray-200 space-y-4">
      <div>
        <p className="text-2xl font-bold text-gray-900">${raised.toLocaleString()}</p>
        <p className="text-sm text-gray-600">pledged of ${goal.toLocaleString()} goal</p>
      </div>

      <div>
        <p className="text-2xl font-bold text-gray-900">{backerCount}</p>
        <p className="text-sm text-gray-600">backers</p>
      </div>

      <div>
        <p className="text-2xl font-bold text-gray-900">{daysLeft}</p>
        <p className="text-sm text-gray-600">days to go</p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-sm text-gray-600">{Math.round(percentage)}% funded</p>
    </div>

    <div className="pt-6 border-t border-gray-200 space-y-2">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span>Smart Contract Escrow</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span>Milestone-Based Release</span>
      </div>
    </div>
  </div>
);

// Project Story Component
const ProjectStory = ({ project }: any) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Overview</h2>
      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {project.story || project.description || 'No project story available yet.'}
      </div>
    </div>

    {project.useOfFunds && project.useOfFunds.length > 0 && (
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Use of Funds</h3>
        <div className="space-y-3">
          {project.useOfFunds.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">{item.item || item.category}</p>
                <p className="text-sm text-gray-600">{item.percentage}% of total</p>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                ${(item.amount || 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}

    {project.website && (
      <div className="pt-6 border-t border-gray-200">
        <a
          href={project.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2"
        >
          Visit Website →
        </a>
      </div>
    )}
  </div>
);

// Project Timeline Component
const ProjectTimeline = ({ project }: any) => {
  const milestones = project.milestones || [
    { title: 'Project Launch', date: 'Jan 2023', description: 'Initial concept development and market research completed.', status: 'completed' },
    { title: 'Pilot Farm Launch', date: 'Apr 2023', description: 'First vertical farm module operational in city A.', status: 'completed' },
    { title: 'Series A Funding Round', date: 'Oct 2023', description: 'Successfully secured initial investment for expansion.', status: 'completed' },
    { title: 'Scaling Operations', date: 'Feb 2024', description: 'Began deployment of 5 new farm units in key urban areas.', status: 'in-progress' },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-gray-900">Project Timeline</h2>
      
      <div className="space-y-6">
        {milestones.map((milestone: any, index: number) => {
          const isCompleted = milestone.status === 'completed' || milestone.status === 'Completed';
          const isInProgress = milestone.status === 'in-progress' || milestone.status === 'In Progress';

          return (
            <div key={index} className="relative flex gap-4">
              {/* Timeline Line */}
              {index < milestones.length - 1 && (
                <div className="absolute left-2 top-8 w-0.5 h-full bg-gray-200"></div>
              )}

              {/* Status Dot */}
              <div className="relative z-10 flex-shrink-0">
                <div className={`w-4 h-4 rounded-full ${
                  isCompleted ? 'bg-blue-600' : isInProgress ? 'bg-blue-400' : 'bg-gray-300'
                }`} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{milestone.title}</h3>
                  <span className="text-sm text-gray-500">{milestone.date || milestone.dueDate}</span>
                </div>
                <p className="text-sm text-gray-600">{milestone.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Project Updates Component
const ProjectUpdates = () => (
  <div className="text-center py-12">
    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-600">No updates yet</p>
  </div>
);

// Project Comments Component
const ProjectComments = () => (
  <div className="text-center py-12">
    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-600">No comments yet</p>
  </div>
);
