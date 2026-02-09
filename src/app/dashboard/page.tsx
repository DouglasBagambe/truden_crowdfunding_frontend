'use client';

import React, { useState, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProjectCard from '@/components/dashboard/ProjectCard';
import RightSidebar from '@/components/dashboard/RightSidebar';
import CreateProjectModal from '@/components/dashboard/CreateProjectModal';
import InvestModal from '@/components/dashboard/InvestModal';
import { motion } from 'framer-motion';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/lib/project-service';
import Link from 'next/link';
import { Search, TrendingUp, ArrowUpRight, Shield, PlusCircle, LayoutDashboard, Wallet, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { data: projectsData, isLoading } = useProjects();
  const { user, isAuthenticated } = useAuth();
  
  const { data: userInvestments, isLoading: investmentsLoading } = useQuery({
    queryKey: ['my-investments', user?.id || user?._id],
    queryFn: () => projectService.getUserInvestments(user?.id || user?._id),
    enabled: !!(user?.id || user?._id)
  });
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');

  const allFetchedProjects = projectsData?.items || [];
  const filteredProjects = useMemo(() => {
    return allFetchedProjects.filter((p: any) => 
      (p.name || p.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allFetchedProjects, searchQuery]);

  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
    setIsInvestModalOpen(true);
  };

  return (
    <div className="bg-[var(--background)] min-h-screen text-[var(--text-main)] pt-[72px] transition-colors duration-300">
      <Navbar />
      
      <main className="container mx-auto p-6 lg:p-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          <div className="flex-1 space-y-8">
            {/* Header / KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard label="Portfolio Value" value="$12,840" trend="+12.5%" icon={<TrendingUp size={16} className="text-emerald-500" />} />
                <KPICard label="Active Positions" value="8" icon={<LayoutDashboard size={16} className="text-blue-500" />} />
                <KPICard label="Reserved (Escrow)" value="$3,200" icon={<Shield size={16} className="text-indigo-500" />} />
            </div>

            {/* Main Tabs Container */}
            <div className="bg-[var(--card)] rounded-[2rem] border border-[var(--border)] overflow-hidden shadow-sm transition-colors duration-300">
                <div className="border-b border-[var(--border)] px-8">
                    <div className="flex items-center justify-between">
                        <nav className="flex gap-10">
                             {['Overview', 'Investments', 'Marketplace', 'DAO'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-6 text-sm font-bold border-b-2 transition-all relative ${
                                        activeTab === tab 
                                        ? 'border-[var(--primary)] text-[var(--primary)]' 
                                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                    }`}
                                >
                                    {tab}
                                    {activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />}
                                </button>
                             ))}
                        </nav>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-50" />
                            <input 
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[var(--background)] rounded-xl py-2 pl-10 pr-4 text-xs font-bold border border-transparent focus:border-[var(--primary)]/20 outline-none w-56 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    {activeTab === 'Overview' && (
                        <div className="space-y-12">
                            {/* Analytics Mockup */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold tracking-tight">Market Analytics</h3>
                                    <div className="flex gap-2">
                                        <button className="text-[10px] font-black uppercase tracking-widest bg-[var(--background)] px-3 py-1.5 rounded-lg border border-[var(--border)]">1W</button>
                                        <button className="text-[10px] font-black uppercase tracking-widest bg-[var(--primary)] text-white px-3 py-1.5 rounded-lg shadow-lg shadow-blue-500/10">1M</button>
                                    </div>
                                </div>
                                <div className="h-48 w-full bg-[var(--background)] rounded-2xl border border-[var(--border)] relative flex items-end p-4 group overflow-hidden">
                                    <div className="w-full h-24 flex items-end justify-between gap-1.5 px-4 overflow-hidden">
                                        {[40, 70, 50, 90, 60, 100, 80, 55, 75, 45, 65, 85].map((h, i) => (
                                            <div key={i} className="flex-1 bg-[var(--primary)] opacity-10 group-hover:opacity-60 transition-all rounded-t-lg" style={{ height: `${h}%` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Project Grid */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold tracking-tight">Vetted Opportunities</h3>
                                    <button 
                                        onClick={() => {
                                            if (!isAuthenticated) {
                                                window.location.href = `/login?next=${encodeURIComponent('/dashboard')}`;
                                            } else {
                                                setIsCreateModalOpen(true);
                                            }
                                        }} 
                                        className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm hover:underline">
                                        <PlusCircle size={16} /> Launch Innovation
                                    </button>
                                </div>
                                
                                {isLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[1,2,3,4].map(i => <div key={i} className="h-48 bg-[var(--background)] rounded-2xl animate-pulse" />)}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {filteredProjects.map((project: any) => (
                                            <ProjectCard 
                                                key={project.id}
                                                project={project}
                                                onClick={() => handleProjectClick(project)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Investments' && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold tracking-tight">Your Portfolio</h3>
                                <div className="text-xs font-bold text-[var(--text-muted)]">
                                    {userInvestments?.length || 0} active investments
                                </div>
                            </div>
                            
                            {investmentsLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[1,2].map(i => <div key={i} className="h-64 bg-[var(--background)] rounded-2xl animate-pulse" />)}
                                </div>
                            ) : userInvestments && userInvestments.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {userInvestments.map((inv: any) => (
                                        <InvestmentItem key={inv.id} investment={inv} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-24 text-center space-y-4 border border-dashed border-[var(--border)] rounded-3xl">
                                    <div className="w-16 h-16 bg-[var(--background)] rounded-2xl flex items-center justify-center mx-auto opacity-50">
                                        <Wallet className="text-[var(--text-muted)]" size={24} />
                                    </div>
                                    <h4 className="text-lg font-bold">No active investments</h4>
                                    <p className="text-sm text-[var(--text-muted)] font-medium max-w-xs mx-auto">
                                        Start backing innovative projects to build your portfolio.
                                    </p>
                                    <button onClick={() => setActiveTab('Overview')} className="button_primary text-xs py-3 px-6 mt-4">
                                        Browse Projects
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {(activeTab !== 'Overview' && activeTab !== 'Investments') && (
                        <div className="py-24 text-center space-y-4">
                            <div className="w-16 h-16 bg-[var(--background)] rounded-2xl flex items-center justify-center mx-auto border border-[var(--border)] opacity-50">
                                <Clock className="text-[var(--text-muted)]" size={24} />
                            </div>
                            <h4 className="text-lg font-bold">Syncing Records</h4>
                            <p className="text-sm text-[var(--text-muted)] font-medium max-w-xs mx-auto">This module is established on-chain. Syncing metadata...</p>
                        </div>
                    )}
                </div>
            </div>
          </div>

          <aside className="w-full lg:w-[380px] space-y-8">
            <RightSidebar />
            
            <div className="bg-[var(--card)] rounded-[2rem] border border-[var(--border)] p-8 space-y-6 shadow-sm transition-colors duration-300">
                <h3 className="text-lg font-bold tracking-tight">Global Activity</h3>
                <div className="space-y-6">
                    <ActivityEntry label="Escrow Verified" time="2h ago" desc="Alpha project release" type="finance" />
                    <ActivityEntry label="Proposal Passing" time="1d ago" desc="Staking rewards v2" type="governance" />
                    <ActivityEntry label="Security Update" time="3d ago" desc="Audit hash updated" type="success" />
                </div>
            </div>
            
            <div className="bg-[var(--primary)] rounded-[2rem] p-8 space-y-4 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl -mr-16 -mt-16 rounded-full" />
                <h3 className="text-lg font-bold relative z-10">Governance Hub</h3>
                <p className="text-sm text-blue-100 font-medium relative z-10 leading-relaxed">Increase protocol reserve for emergency project recovery?</p>
                <div className="flex gap-3 pt-4 relative z-10">
                    <button className="flex-1 bg-white text-[var(--primary)] font-bold py-3 rounded-xl text-xs hover:bg-gray-100 transition-all shadow-sm">APPROVE</button>
                    <button className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl text-xs hover:bg-white/20 border border-white/20 transition-all">REJECT</button>
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

const InvestmentItem = ({ investment }: any) => (
    <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden hover:border-[var(--primary)]/50 transition-all group shadow-sm">
        {/* Image & Status */}
        <div className="h-48 bg-[var(--secondary)] relative overflow-hidden">
            {investment.project?.imageUrl ? (
                <img src={investment.project.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <span className="text-4xl">🚀</span>
                </div>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
                <span className={`px-3 py-1 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg ${
                    investment.status === 'completed' ? 'bg-green-500/80' : 
                    investment.status === 'refunded' ? 'bg-rose-500/80' : 'bg-black/50'
                }`}>
                    {investment.status}
                </span>
            </div>
        </div>
        
        <div className="p-6 space-y-6">
            <div className="space-y-2">
                <h4 className="text-lg font-bold text-[var(--text-main)] line-clamp-1">
                    {investment.project?.title || 'Unknown Project'}
                </h4>
                <div className="flex justify-between items-center text-sm">
                   <span className="text-[var(--text-muted)] font-medium">Invested Amount</span>
                   <span className="font-bold text-[var(--primary)]">{investment.amount} CELO</span>
                </div>
            </div>
            
            <div className="pt-4 border-t border-[var(--border)] flex justify-between items-center">
                 <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
                    <Clock size={14} />
                    <span>{new Date(investment.createdAt).toLocaleDateString()}</span>
                 </div>
                 <Link href={`/explore/${investment.project?.id || '#'}`} className="text-xs font-black uppercase tracking-widest text-[var(--primary)] hover:underline">
                    View Details
                 </Link>
            </div>
        </div>
    </div>
);

const KPICard = ({ label, value, trend, icon }: any) => (
    <div className="bg-[var(--card)] p-8 rounded-[2rem] border border-[var(--border)] space-y-4 shadow-sm hover:border-[var(--primary)]/50 transition-all group duration-300">
        <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
            <div className="w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center border border-[var(--border)] group-hover:bg-[var(--secondary)] transition-colors">
                {icon}
            </div>
        </div>
        <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black tracking-tight text-[var(--text-main)]">{value}</p>
            {trend && <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-md tracking-widest">{trend}</span>}
        </div>
    </div>
);

const ActivityEntry = ({ label, time, desc, type }: any) => (
    <div className="flex gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
            type === 'finance' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-800/30' :
            type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800/30' :
            'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-800/30'
        }`}>
            {type === 'finance' && <Wallet size={16} />}
            {type === 'success' && <ArrowUpRight size={16} />}
            {type === 'governance' && <Shield size={16} />}
        </div>
        <div className="space-y-0.5">
            <p className="text-xs font-bold text-[var(--text-main)]">{label}</p>
            <p className="text-xs text-[var(--text-muted)] font-medium">{desc}</p>
            <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.1em] pt-1 opacity-60">{time}</p>
        </div>
    </div>
);
