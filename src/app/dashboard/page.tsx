'use client';

import React, { useState, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProjectCard from '@/components/dashboard/ProjectCard';
import RightSidebar from '@/components/dashboard/RightSidebar';
import CreateProjectWizard from '@/components/dashboard/CreateProjectWizard';
import InvestModal from '@/components/dashboard/InvestModal';
import { NFTPortfolio } from '@/components/dashboard/NFTPortfolio';
import { motion } from 'framer-motion';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useInvestments } from '@/hooks/useInvestments';
import { Search, TrendingUp, ArrowUpRight, Shield, PlusCircle, LayoutDashboard, Wallet, Clock, Rocket, Target, Hexagon } from 'lucide-react';
import Link from 'next/link';

interface Project {
    id: string;
    name?: string;
    title?: string;
    creatorId?: string;
    [key: string]: any;
}

interface ProjectsData {
    items: Project[];
}

interface KPICardProps {
    label: string;
    value: string;
    trend?: string;
    icon: React.ReactNode;
}

interface ActivityEntryProps {
    label: string;
    time: string;
    desc: string;
    type: 'finance' | 'governance' | 'success';
}
import { Search, TrendingUp, ArrowUpRight, Shield, PlusCircle, LayoutDashboard, Wallet, Clock, Vote, CheckCircle2, XCircle } from 'lucide-react';

export default function DashboardPage() {
    const { data: projectsData, isLoading } = useProjects();
    const { data: investmentsData, isLoading: isLoadingInvestments } = useInvestments();
    const { user, isAuthenticated } = useAuth();

    const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'investments' | 'campaigns' | 'nfts'>('investments');

    const allFetchedProjects = projectsData?.items || [];

    // Filter user's campaigns (projects they created)
    const myCampaigns = useMemo(() => {
        return allFetchedProjects.filter((p: Project) =>
            p.creatorId === user?.id
        );
    }, [allFetchedProjects, user]);

    // Get projects user has invested in
    const myInvestmentProjects = useMemo(() => {
        if (!investmentsData || investmentsData.length === 0) return [];

        const investedProjectIds = new Set(investmentsData.map(inv => inv.projectId));
        return allFetchedProjects.filter((p: Project) =>
            investedProjectIds.has(p.id)
        );
    }, [allFetchedProjects, investmentsData]);

    // Apply search filter
    const filteredInvestments = useMemo(() => {
        return myInvestmentProjects.filter((p: Project) =>
            (p.name || p.title || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [myInvestmentProjects, searchQuery]);

    const filteredCampaigns = useMemo(() => {
        return myCampaigns.filter((p: Project) =>
            (p.name || p.title || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [myCampaigns, searchQuery]);

    const displayedProjects = activeTab === 'investments' ? filteredInvestments : filteredCampaigns;
    const isDataLoading = isLoading || isLoadingInvestments;

    // Calculate portfolio stats
    const portfolioValue = useMemo(() => {
        if (!investmentsData) return 0;
        return investmentsData.reduce((sum, inv) => sum + inv.amount, 0);
    }, [investmentsData]);

    const activePositions = investmentsData?.length || 0;

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
                            <KPICard
                                label="Portfolio Value"
                                value={`$${portfolioValue.toFixed(2)}`}
                                trend={portfolioValue > 0 ? "+12.5%" : undefined}
                                icon={<TrendingUp size={16} className="text-emerald-500" />}
                            />
                            <KPICard
                                label="Active Positions"
                                value={activePositions.toString()}
                                icon={<LayoutDashboard size={16} className="text-blue-500" />}
                            />
                            <KPICard
                                label="My Campaigns"
                                value={myCampaigns.length.toString()}
                                icon={<Rocket size={16} className="text-indigo-500" />}
                            />
                        </div>

                        {/* Main Dashboard Container */}
                        <div className="bg-[var(--card)] rounded-[2rem] border border-[var(--border)] overflow-hidden shadow-sm transition-colors duration-300">
                            <div className="border-b border-[var(--border)] px-8">
                                <div className="flex items-center justify-between">
                                    <nav className="flex gap-10">
                                        {[
                                            { key: 'investments', label: 'My Investments', icon: <Target size={14} /> },
                                            { key: 'campaigns', label: 'My Campaigns', icon: <Rocket size={14} /> },
                                            { key: 'nfts', label: 'My NFTs', icon: <Hexagon size={14} /> }
                                        ].map(tab => (
                                            <button
                                                key={tab.key}
                                                onClick={() => setActiveTab(tab.key as 'investments' | 'campaigns' | 'nfts')}
                                                className={`py-6 text-sm font-bold border-b-2 transition-all relative flex items-center gap-2 ${activeTab === tab.key
                                                    ? 'border-[var(--primary)] text-[var(--primary)]'
                                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                                    }`}
                                            >
                                                {tab.icon}
                                                {tab.label}
                                                {activeTab === tab.key && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />}
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
                                {activeTab === 'investments' ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold tracking-tight">Your Investment Portfolio</h3>
                                            <Link href="/explore" className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm hover:underline">
                                                <PlusCircle size={16} /> Discover Projects
                                            </Link>
                                        </div>

                                        {isDataLoading ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-[var(--background)] rounded-2xl animate-pulse" />)}
                                            </div>
                                        ) : displayedProjects.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {displayedProjects.map((project: Project) => (
                                                    <ProjectCard
                                                        key={project.id}
                                                        project={project}
                                                        onClick={() => handleProjectClick(project)}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-24 text-center space-y-4">
                                                <div className="w-16 h-16 bg-[var(--background)] rounded-2xl flex items-center justify-center mx-auto border border-[var(--border)] opacity-50">
                                                    <Target className="text-[var(--text-muted)]" size={24} />
                                                </div>
                                                <h4 className="text-lg font-bold">No Investments Yet</h4>
                                                <p className="text-sm text-[var(--text-muted)] font-medium max-w-xs mx-auto">
                                                    Start backing innovative projects and grow your portfolio.
                                                </p>
                                                <Link href="/explore" className="button_primary inline-flex items-center gap-2 mt-4">
                                                    <PlusCircle size={16} /> Explore Projects
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ) : activeTab === 'nfts' ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold tracking-tight">Your NFT Portfolio</h3>
                                        </div>
                                        <NFTPortfolio />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold tracking-tight">Your Campaigns</h3>
                                            <Link
                                                href="/dashboard/create-project"
                                                className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm hover:underline"
                                            >
                                                <PlusCircle size={16} /> Create Campaign
                                            </Link>
                                        </div>

                                        {isDataLoading ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {[1, 2].map(i => <div key={i} className="h-48 bg-[var(--background)] rounded-2xl animate-pulse" />)}
                                            </div>
                                        ) : displayedProjects.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {displayedProjects.map((project: Project) => (
                                                    <ProjectCard
                                                        key={project.id}
                                                        project={project}
                                                        onClick={() => handleProjectClick(project)}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-24 text-center space-y-4">
                                                <div className="w-16 h-16 bg-[var(--background)] rounded-2xl flex items-center justify-center mx-auto border border-[var(--border)] opacity-50">
                                                    <Rocket className="text-[var(--text-muted)]" size={24} />
                                                </div>
                                                <h4 className="text-lg font-bold">No Campaigns Yet</h4>
                                                <p className="text-sm text-[var(--text-muted)] font-medium max-w-xs mx-auto">
                                                    Launch your first campaign and bring your innovation to life.
                                                </p>
                                                <Link href="/dashboard/create-project" className="button_primary inline-flex items-center gap-2 mt-4">
                                                    <Rocket size={16} /> Create Campaign
                                                </Link>
                                            </div>
                                        )}
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
          <aside className="w-full lg:w-[380px] space-y-8">
            {/* Active Votes Section - IMPROVED COLORS */}
            <div className="bg-[var(--card)] rounded-[2rem] border border-[var(--border)] p-8 space-y-6 shadow-sm transition-colors duration-300">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold tracking-tight text-[var(--text-main)]">Active Votes</h3>
                    <button className="text-xs font-bold text-[var(--primary)] hover:underline">View Hub</button>
                </div>
                <div className="space-y-5">
                    <VoteCard 
                        title="Adjust APY Multiplier"
                        description="Impacts long-term staking pools."
                        status="passing"
                        progress={82}
                    />
                    <VoteCard 
                        title="New Listing: SolX"
                        description="Solar energy tech proposal."
                        status="failing"
                        progress={24}
                    />
                </div>
            </div>

            {/* Submit Project CTA - IMPROVED COLORS */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-[2rem] p-8 space-y-4 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                <div className="relative z-10 space-y-4">
                    <h3 className="text-lg font-bold">Got a Vision?</h3>
                    <p className="text-sm text-blue-50 font-medium leading-relaxed">Submit your project and get funded by a global network of backers.</p>
                    <button className="w-full bg-white text-blue-600 font-bold py-3.5 rounded-xl text-xs hover:bg-gray-50 transition-all shadow-lg mt-2">
                        SUBMIT PROJECT
                    </button>
                    <div className="flex gap-3 pt-2">
                        <div className="flex items-center gap-2 text-xs text-blue-100">
                            <Shield size={14} />
                            <span className="font-medium">Escrow Protected</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-100">
                            <CheckCircle2 size={14} />
                            <span className="font-medium">Audited Contracts</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Global Activity - IMPROVED COLORS */}
            <div className="bg-[var(--card)] rounded-[2rem] border border-[var(--border)] p-8 space-y-6 shadow-sm transition-colors duration-300">
                <h3 className="text-lg font-bold tracking-tight text-[var(--text-main)]">Global Activity</h3>
                <div className="space-y-6">
                    <ActivityEntry label="Escrow Verified" time="2h ago" desc="Alpha project release" type="finance" />
                    <ActivityEntry label="Proposal Passing" time="1d ago" desc="Staking rewards v2" type="governance" />
                    <ActivityEntry label="Security Update" time="3d ago" desc="Audit hash updated" type="success" />
                </div>
            </div>
            
            {/* Governance Hub - IMPROVED COLORS */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-[2rem] p-8 space-y-4 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl -mr-16 -mt-16 rounded-full" />
                <h3 className="text-lg font-bold relative z-10">Governance Hub</h3>
                <p className="text-sm text-indigo-50 font-medium relative z-10 leading-relaxed">Increase protocol reserve for emergency project recovery?</p>
                <div className="flex gap-3 pt-4 relative z-10">
                    <button className="flex-1 bg-white text-indigo-600 font-bold py-3 rounded-xl text-xs hover:bg-gray-50 transition-all shadow-sm">APPROVE</button>
                    <button className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl text-xs hover:bg-white/20 border border-white/20 transition-all">REJECT</button>
                </div>
            </div>
          </aside>

                </div>
            </main>

            <InvestModal
                isOpen={isInvestModalOpen}
                onClose={() => setIsInvestModalOpen(false)}
                project={selectedProject || {}}
            />
            <Footer />
        </div>
    );
      <CreateProjectWizard isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <InvestModal 
        isOpen={isInvestModalOpen} 
        onClose={() => setIsInvestModalOpen(false)}
        project={selectedProject || {}}
      />
      <Footer />
    </div>
  );
}

const KPICard = ({ label, value, trend, icon }: KPICardProps) => (
    <div className="bg-[var(--card)] p-8 rounded-[2rem] border border-[var(--border)] space-y-4 shadow-sm hover:border-[var(--primary)]/50 transition-all group duration-300">
        <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
            <div className="w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center border border-[var(--border)] group-hover:bg-[var(--secondary)] transition-colors">
                {icon}
            </div>
        </div>
        <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black tracking-tight text-[var(--text-main)]">{value}</p>
            {trend && <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-1 rounded-md tracking-widest">{trend}</span>}
        </div>
    </div>
);

const VoteCard = ({ title, description, status, progress }: any) => {
    const isPassing = status === 'passing';
    
    return (
        <div className="space-y-3 p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-bold text-[var(--text-main)]">{title}</h4>
                    <p className="text-xs text-[var(--text-muted)] font-medium">{description}</p>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shrink-0 ${
                    isPassing 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                    {status}
                </span>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-[var(--text-muted)] uppercase tracking-widest">Progress</span>
                    <span className={isPassing ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all ${
                            isPassing 
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                                : 'bg-gradient-to-r from-red-500 to-red-600'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

const ActivityEntry = ({ label, time, desc, type }: ActivityEntryProps) => (
    <div className="flex gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${type === 'finance' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-800/30' :
            type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800/30' :
                'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-800/30'
            }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
            type === 'finance' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/30' :
            type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30' :
            'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/30'
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