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
    <div className="pt-24 bg-background min-h-screen text-foreground selection:bg-indigo-100 dark:selection:bg-indigo-900/40">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 pb-24">
        <div className="flex flex-col lg:flex-row gap-12">
          
          <div className="flex-1 space-y-16">
            {/* Hero Section */}
            <div className="relative h-[480px] rounded-[3.5rem] overflow-hidden premium-shadow group border border-gray-100 dark:border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/60 to-transparent z-10" />
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-1000" />
              
              <div className="relative z-20 h-full flex flex-col justify-center px-16 max-w-3xl space-y-8">
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-6xl font-bold leading-tight text-white tracking-tight"
                >
                  Invest in the Future, <span className="text-indigo-400">Today</span>
                </motion.h1>
                <motion.p 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.1 }}
                  className="text-slate-300 text-xl leading-relaxed font-medium"
                >
                  Truden connects bold innovators with visionary investors. 
                  Build more than just projects—build lasting legacies.
                </motion.p>
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 }}
                  className="flex gap-5"
                >
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-[1.5rem] transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                    Explore Projects
                  </button>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white font-bold py-4 px-10 rounded-[1.5rem] border border-white/20 transition-all flex items-center gap-2.5 active:scale-95"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Launch Project
                  </button>
                </motion.div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCard label="Total Raised" value="$12.5M" />
              <StatCard label="Success Rate" value="94%" />
              <StatCard label="Investors" value="15k+" />
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-6">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                </div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Synchronizing Ecosystem...</p>
              </div>
            ) : error ? (
              <div className="p-12 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-[3rem] text-center space-y-4">
                <p className="text-rose-600 dark:text-rose-400 font-bold text-xl">Service Temporarily Unavailable</p>
                <p className="text-rose-400 dark:text-rose-500/60 text-sm font-medium italic">Our neural links to the backend are down. Please stand by.</p>
              </div>
            ) : (
              <>
                {/* Featured Projects */}
                {featuredProjects.length > 0 && (
                  <section className="space-y-8">
                    <div className="flex items-center gap-4">
                      <h2 className="text-3xl font-bold tracking-tight">Featured</h2>
                      <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800" />
                    </div>
                    <div className="flex overflow-x-auto gap-8 pb-8 scrollbar-hide -mx-2 px-2">
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
                <section className="space-y-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <h2 className="text-3xl font-bold tracking-tight">Discover</h2>
                    <div className="flex items-center gap-2 bg-gray-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <FilterTab label="All" active />
                      <FilterTab label="Fintech" />
                      <FilterTab label="Sustainable" />
                      <FilterTab label="AI & Tech" />
                    </div>
                  </div>

                  {regularProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
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
                    <div className="py-24 text-center bg-gray-50 dark:bg-slate-900/50 rounded-[4rem] border-2 border-dashed border-gray-200 dark:border-slate-800 space-y-6">
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Quiet on the front...</p>
                      <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:opacity-80 transition-opacity"
                      >
                        Be the first to innovate +
                      </button>
                    </div>
                  )}

                  {/* Pagination */}
                  {regularProjects.length > 0 && (
                    <div className="flex items-center justify-center gap-3 pt-12">
                      <button className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-xl shadow-indigo-600/20 active:scale-90 transition-transform">1</button>
                      <button className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 text-gray-400 font-bold text-lg border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">2</button>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          <aside className="lg:w-[380px]">
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
  <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-3">
    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{label}</p>
    <p className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
  </div>
);

const FilterTab = ({ label, active }: { label: string; active?: boolean }) => (
  <button className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${active ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-100 dark:border-slate-800' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
    {label}
  </button>
);
