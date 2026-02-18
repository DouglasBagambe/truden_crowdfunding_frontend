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
import { useProjects, useMyProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useInvestments } from '@/hooks/useInvestments';
import { Search, TrendingUp, ArrowUpRight, Shield, PlusCircle, LayoutDashboard, Wallet, Rocket, Target, Hexagon } from 'lucide-react';
import Link from 'next/link';

interface Project {
    id: string;
    _id?: string;
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

export default function DashboardPage() {
    const { data: projectsData, isLoading } = useProjects();
    const { data: investmentsData, isLoading: isLoadingInvestments } = useInvestments();
    const { user, isAuthenticated } = useAuth();

    const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'investments' | 'campaigns' | 'nfts'>('investments');

    const allFetchedProjects = projectsData?.items || [];

    // My campaigns: use the dedicated /projects/me endpoint that includes DRAFTs
    const { data: myProjectsData } = useMyProjects();
    const myCampaigns = useMemo(() => {
        return Array.isArray(myProjectsData) ? myProjectsData : [];
    }, [myProjectsData]);

    // Get projects user has invested in
    const myInvestmentProjects = useMemo(() => {
        if (!investmentsData || investmentsData.length === 0) return [];

        const investedProjectIds = new Set(investmentsData.map((inv: any) => inv.projectId));
        return allFetchedProjects.filter((p: Project) =>
            investedProjectIds.has(p.id || p._id!)
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
        return investmentsData.reduce((sum: number, inv: any) => sum + inv.amount, 0);
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
                                                        key={project.id || project._id}
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
                                                href="/create-project"
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
                                                        key={project.id || project._id}
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
                                                <Link href="/create-project" className="button_primary inline-flex items-center gap-2 mt-4">
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
                        <RightSidebar onTriggerCreate={() => setIsCreateModalOpen(true)} />

                        {/* Recent Activity - Alternative View */}
                        <div className="bg-[var(--card)] rounded-[2rem] border border-[var(--border)] p-8 space-y-6 shadow-sm transition-colors duration-300">
                            <h3 className="text-lg font-bold tracking-tight text-[var(--text-main)]">Global Activity</h3>
                            <div className="space-y-6">
                                <ActivityEntry label="Escrow Verified" time="2h ago" desc="Alpha project release" type="finance" />
                                <ActivityEntry label="Proposal Passing" time="1d ago" desc="Staking rewards v2" type="governance" />
                                <ActivityEntry label="Security Update" time="3d ago" desc="Audit hash updated" type="success" />
                            </div>
                        </div>
                    </aside>

                </div>
            </main>

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
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shrink-0 ${isPassing
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
                        className={`h-full rounded-full transition-all ${isPassing
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
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${type === 'finance' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/30' :
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