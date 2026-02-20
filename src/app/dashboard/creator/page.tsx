'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus, TrendingUp, Users, DollarSign, Package,
  Eye, Edit, MoreVertical, CheckCircle, Clock,
  AlertCircle
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CreateProjectWizard from '@/components/dashboard/CreateProjectWizard';
import { projectService } from '@/lib/project-service';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function CreatorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch creator's projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['creator-projects'],
    queryFn: async () => {
      // This would fetch from your backend
      return await projectService.getMyProjects();
    },
  });

  const myProjects = Array.isArray(projects) ? projects : (projects?.projects || projects?.items || []);
  const activeProjects = myProjects.filter((p: any) => p.status === 'ACTIVE' || p.status === 'Active').length;
  const totalRaised = myProjects.reduce((sum: number, p: any) => sum + (p.raisedAmount || 0), 0);
  const totalBackers = myProjects.reduce((sum: number, p: any) => sum + (p.backerCount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Creator Dashboard</h1>
              <p className="text-gray-600">Manage your projects and track performance</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<Package className="w-5 h-5" />}
              label="Active Projects"
              value={activeProjects.toString()}
              trend="+2"
              trendUp={true}
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Total Raised"
              value={`$${totalRaised.toLocaleString()}`}
              trend="+12%"
              trendUp={true}
            />
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Total Backers"
              value={totalBackers.toString()}
              trend="+45"
              trendUp={true}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Completion Rate"
              value="67%"
              trend="+5%"
              trendUp={true}
            />
          </div>

          {/* Projects List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">My Projects</h2>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading projects...</p>
                </div>
              ) : myProjects.length > 0 ? (
                <div className="space-y-4">
                  {myProjects.map((project: any) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onView={() => router.push(`/explore/${project.id}`)}
                      onEdit={() => router.push(`/dashboard/creator/${project.id}/edit`)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Package className="w-12 h-12" />}
                  title="No Projects Yet"
                  description="Create your first project to get started"
                  action={{
                    label: "Create Project",
                    onClick: () => setIsCreateModalOpen(true)
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Create Project Modal */}
      <CreateProjectWizard
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}

// Stat Card Component
const StatCard = ({ icon, label, value, trend, trendUp }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
  >
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
        {icon}
      </div>
      <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-gray-500'}`}>
        {trend}
      </span>
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-sm text-gray-600">{label}</p>
  </motion.div>
);

// Project Card Component
const ProjectCard = ({ project, onView, onEdit }: any) => {
  const raised = project.raisedAmount || 0;
  const goal = project.goalAmount || project.targetAmount || 100000;
  const percentage = Math.min((raised / goal) * 100, 100);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{project.name || project.title}</h3>
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {getStatusIcon(project.status)}
              {project.status || 'Active'}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{project.summary || project.description}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onView}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="View Project"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit Project"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Raised</p>
          <p className="text-lg font-semibold text-gray-900">${raised.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Goal</p>
          <p className="text-lg font-semibold text-gray-900">${goal.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Backers</p>
          <p className="text-lg font-semibold text-gray-900">{project.backerCount || 0}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-semibold text-gray-900">{Math.round(percentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ icon, title, description, action }: any) => (
  <div className="text-center py-12">
    <div className="text-gray-400 mb-4 flex justify-center">{icon}</div>
    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-600 mb-4">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        {action.label}
      </button>
    )}
  </div>
);
