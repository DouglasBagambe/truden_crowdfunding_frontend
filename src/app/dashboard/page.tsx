'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProjectCard from '@/components/dashboard/ProjectCard';
import RightSidebar from '@/components/dashboard/RightSidebar';
import CreateProjectModal from '@/components/dashboard/CreateProjectModal';
import InvestModal from '@/components/dashboard/InvestModal';
import { motion } from 'framer-motion';
import { useProjects } from '@/hooks/useProjects';
import { Loader2, PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  const { data: projectsData, isLoading, error } = useProjects();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Extract items from paginated response
  const allFetchedProjects = projectsData?.items || [];
  
  // Split into featured and others for demo
  const featuredProjects = allFetchedProjects.slice(0, 3);
  const regularProjects = allFetchedProjects.length > 0 ? allFetchedProjects : [];

  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
    setIsInvestModalOpen(true);
  };

  return (
    <div className="pt-24 bg-white min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex flex-col lg:flex-row gap-12">
          
          <div className="flex-1 space-y-12">
            {/* Hero Section */}
            <div className="relative h-[400px] rounded-[3rem] overflow-hidden bg-gray-900 group">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-transparent z-10" />
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
              
              <div className="relative z-20 h-full flex flex-col justify-center px-12 max-w-2xl space-y-6 text-white">
                <h1 className="text-5xl font-bold leading-tight">
                  Invest in the Future, Today
                </h1>
                <p className="text-gray-300 text-lg">
                  Truden is a platform for investing in real-world projects and people. 
                  Join a community of innovators and investors shaping tomorrow's landscape.
                </p>
                <div className="flex gap-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-2xl transition-all">
                    Explore Projects
                  </button>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold py-3 px-8 rounded-2xl transition-all flex items-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Create a Project
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Total Funds Raised" value="$12.5M" />
              <StatCard label="Projects Funded" value="350+" />
              <StatCard label="Active Investors" value="15,000+" />
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-medium">Fetching the latest projects...</p>
              </div>
            ) : error ? (
              <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-center">
                <p className="text-red-600 font-bold mb-2">Failed to load projects</p>
                <p className="text-red-400 text-sm italic">Please check if the backend server is running.</p>
              </div>
            ) : (
              <>
                {/* Featured Projects */}
                {featuredProjects.length > 0 && (
                  <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Featured Projects</h2>
                    <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
                      {featuredProjects.map((project: any) => (
                        <ProjectCard 
                          key={project.id} 
                          title={project.name || project.title}
                          description={project.summary || project.description}
                          raised={project.raisedAmount || 0}
                          target={project.targetAmount || 1000}
                          featured 
                          onClick={() => handleProjectClick({
                            id: project.id,
                            title: project.name || project.title
                          })}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* All Projects */}
                <section className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-gray-900">All Projects</h2>
                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                      <FilterTab label="All" active />
                      <FilterTab label="Technology" />
                      <FilterTab label="Sustainability" />
                      <FilterTab label="Community" />
                    </div>
                  </div>

                  {regularProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      {regularProjects.map((project: any) => (
                        <ProjectCard 
                          key={project.id} 
                          title={project.name || project.title}
                          description={project.summary || project.description}
                          raised={project.raisedAmount || 0}
                          target={project.targetAmount || 1000}
                          onClick={() => handleProjectClick({
                            id: project.id,
                            title: project.name || project.title
                          })}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                      <p className="text-gray-400 font-medium italic">No projects found. Be the first to create one!</p>
                      <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-6 text-blue-600 font-bold hover:underline"
                      >
                        Launch your project now
                      </button>
                    </div>
                  )}

                  {/* Pagination Placeholder */}
                  {regularProjects.length > 0 && (
                    <div className="flex items-center justify-center gap-2 pt-10">
                      <button className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-100 italic">1</button>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          <aside className="lg:w-[350px]">
            <RightSidebar onTriggerCreate={() => setIsCreateModalOpen(true)} />
          </aside>

        </div>
      </main>

      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />

      <InvestModal 
        isOpen={isInvestModalOpen} 
        onClose={() => setIsInvestModalOpen(false)}
        project={selectedProject || {}}
      />

      <Footer />
    </div>
  );
}

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm text-center space-y-2">
    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{label}</p>
    <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
  </div>
);

const FilterTab = ({ label, active }: { label: string; active?: boolean }) => (
  <button className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}`}>
    {label}
  </button>
);
