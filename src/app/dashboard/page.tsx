'use client';

import React, { useState, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProjectCard from '@/components/dashboard/ProjectCard';
import RightSidebar from '@/components/dashboard/RightSidebar';
import CreateProjectModal from '@/components/dashboard/CreateProjectModal';
import InvestModal from '@/components/dashboard/InvestModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '@/hooks/useProjects';
import { Loader2, PlusCircle, Search, SlidersHorizontal, ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  const { data: projectsData, isLoading, error } = useProjects();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const allFetchedProjects = projectsData?.items || [];
  
  const filteredProjects = useMemo(() => {
    return allFetchedProjects.filter((p: any) => {
      const matchesSearch = (p.name || p.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'All' || (p.industry || '').toUpperCase() === activeTab.toUpperCase();
      return matchesSearch && matchesTab;
    });
  }, [allFetchedProjects, searchQuery, activeTab]);

  const featuredProjects = useMemo(() => {
    return allFetchedProjects.slice(0, 3);
  }, [allFetchedProjects]);

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
            <section className="relative h-[520px] rounded-[4rem] overflow-hidden premium-shadow group border border-gray-100 dark:border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/60 to-transparent z-10" />
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-1000" />
              
              <div className="relative z-20 h-full flex flex-col justify-center px-16 max-w-3xl space-y-8">
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full w-fit">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Governance Active</span>
                </div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-7xl font-bold leading-[0.9] text-white tracking-tighter"
                >
                  Finance <br /> <span className="text-indigo-400">Reimagined.</span>
                </motion.h1>
                <motion.p 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1 }}
                  className="text-slate-300 text-lg leading-relaxed font-medium max-w-xl"
                >
                  Truden is the decentralized protocol for high-integrity project funding. 
                  Direct, transparent, and built on-chain.
                </motion.p>
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: 0.2 }}
                  className="flex gap-4 pt-4"
                >
                  <button className="premium-gradient text-white font-black text-xs uppercase tracking-widest py-4.5 px-10 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center gap-2">
                    Start Investing <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-white/5 hover:bg-white/10 backdrop-blur-xl text-white font-black text-xs uppercase tracking-widest py-4.5 px-10 rounded-2xl border border-white/20 transition-all active:scale-95"
                  >
                    Launch Proposal
                  </button>
                </motion.div>
              </div>
            </section>

            {/* Content Area */}
            <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-gray-100 dark:border-slate-800 pb-8">
                    <div className="space-y-4">
                        <h2 className="text-4xl font-bold tracking-tight">Marketplace</h2>
                        <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-900 p-1 rounded-2xl border border-gray-100 dark:border-slate-800">
                            {['All', 'Technology', 'Fintech', 'Sustainability'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all w-[300px]"
                            />
                        </div>
                        <button className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-400 hover:text-indigo-600 transition-colors">
                            <SlidersHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                    {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
                  </div>
                ) : error ? (
                  <div className="p-20 bg-rose-50 dark:bg-rose-950/10 border-2 border-dashed border-rose-100 dark:border-rose-900/30 rounded-[4rem] text-center space-y-4">
                    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                    </div>
                    <p className="text-rose-600 dark:text-rose-400 font-bold text-xl uppercase tracking-widest">Connection Interrupted</p>
                    <p className="text-rose-400 dark:text-rose-500/60 text-xs font-black uppercase tracking-widest">Re-establishing neural link...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                     <AnimatePresence mode="popLayout">
                        {filteredProjects.map((project: any) => (
                            <motion.div
                                layout
                                key={project.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ProjectCard 
                                    title={project.name || project.title}
                                    description={project.summary || project.description}
                                    raised={project.raisedAmount || 0}
                                    target={project.targetAmount || 1000}
                                    onClick={() => handleProjectClick(project)}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {filteredProjects.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-gray-50/50 dark:bg-slate-900/50 rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-slate-800">
                             <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">No matching assets found</p>
                        </div>
                    )}
                  </div>
                )}
            </div>
          </div>

          <aside className="lg:w-[380px] space-y-8">
            <RightSidebar onTriggerCreate={() => setIsCreateModalOpen(true)} />
            
            {/* Quick Stats sidebar extension */}
             <div className="glass-card rounded-[2.5rem] p-8 space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Network health</h4>
                <div className="space-y-4">
                    <HealthRow label="TVL" value="$12.5M" progress={80} />
                    <HealthRow label="Volume 24h" value="$1.2M" progress={65} />
                    <HealthRow label="Nodes" value="1,245" progress={45} />
                </div>
            </div>
          </aside>

        </div>
      </main>

      <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <InvestModal 
        isOpen={isInvestModalOpen} 
        onClose={() => setIsInvestModalOpen(false)}
        project={selectedProject || {}}
      />
      <Footer />
    </div>
  );
}

const SkeletonCard = () => (
    <div className="bg-gray-50 dark:bg-slate-900 h-[420px] rounded-[3rem] border border-gray-100 dark:border-slate-800 overflow-hidden animate-pulse">
        <div className="h-48 bg-gray-100 dark:bg-slate-800" />
        <div className="p-8 space-y-4">
            <div className="h-6 w-2/3 bg-gray-100 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-full bg-gray-100 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-1/2 bg-gray-100 dark:bg-slate-800 rounded-lg" />
            <div className="pt-8 h-12 w-full bg-gray-100 dark:bg-slate-800 rounded-2xl" />
        </div>
    </div>
);

const HealthRow = ({ label, value, progress }: any) => (
    <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-bold">
            <span className="text-gray-500 uppercase">{label}</span>
            <span className="text-gray-700 dark:text-gray-300">{value}</span>
        </div>
        <div className="h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
    </div>
);
