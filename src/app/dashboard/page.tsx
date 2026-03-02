'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProjectCard from '@/components/dashboard/ProjectCard';
import RightSidebar from '@/components/dashboard/RightSidebar';
import CreateProjectWizard from '@/components/dashboard/CreateProjectWizard';
import InvestModal from '@/components/dashboard/InvestModal';
import { NFTPortfolio } from '@/components/dashboard/NFTPortfolio';
import { NotificationsView } from '@/components/dashboard/NotificationsView';
import { KYCView } from '@/components/dashboard/KYCView';
import { WalletView } from '@/components/dashboard/WalletView';
import KYCModal from '@/components/dashboard/KYCModal';
import { motion } from 'framer-motion';
import { useProjects, useMyProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useInvestments } from '@/hooks/useInvestments';
import { Search, LineChart, ArrowUpRight, Shield, PlusCircle, LayoutDashboard, Wallet, Briefcase, Activity, Image as ImageIcon, ShieldCheck, Bell } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    const router = useRouter();

    useEffect(() => {
        console.log('[DASHBOARD_DEBUG] User:', user);
        console.log('[DASHBOARD_DEBUG] Authenticated:', isAuthenticated);
    }, [user, isAuthenticated]);

    const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'investments' | 'donations' | 'campaigns' | 'nfts'>('investments');

    const handleTriggerCreate = () => {
        router.push('/dashboard/create-project');
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('create') === 'true') {
                setIsCreateModalOpen(true);
                // Clean up the URL
                window.history.replaceState({}, '', '/dashboard');
            }
        }
    }, []);

    const allFetchedProjects = projectsData?.items || [];

    // My campaigns: use the dedicated /projects/me endpoint that includes DRAFTs
    const { data: myProjectsData, isLoading: isLoadingMyProjects } = useMyProjects();

    useEffect(() => {
        console.log('[DASHBOARD_DEBUG] myProjectsData:', myProjectsData);
        console.log('[DASHBOARD_DEBUG] investmentsData:', investmentsData);
        console.log('[DASHBOARD_DEBUG] allFetchedProjects (Public):', allFetchedProjects);
    }, [myProjectsData, investmentsData, allFetchedProjects]);

    const myCampaigns = useMemo(() => {
        return Array.isArray(myProjectsData) ? myProjectsData : [];
    }, [myProjectsData]);

    // Get projects user has interacted with
    const myInvestmentProjects = useMemo(() => {
        if (!investmentsData || investmentsData.length === 0) return [];

        const projectMap = new Map(allFetchedProjects.map((p: any) => [String(p.id || p._id), p]));

        const projects = investmentsData.map((inv: any) => {
            const invProjectId = String(inv.projectId || inv.project?.id || inv.project?._id);
            const p = projectMap.get(invProjectId);

            // Prioritize fetched project but fallback to populated inv.project
            if (p) return { ...p, ...inv.project };
            if (inv.project) {
                return {
                    id: invProjectId,
                    _id: invProjectId,
                    name: inv.project.title || inv.project.name || 'Untitled',
                    title: inv.project.title || inv.project.name || 'Untitled',
                    category: inv.project.category || 'Uncategorized',
                    projectType: (inv.project.type || inv.project.projectType || 'ROI').toUpperCase(),
                    type: (inv.project.type || inv.project.projectType || 'ROI').toUpperCase(),
                    raisedAmount: Number(inv.project.raisedAmount || 0),
                    targetAmount: Number(inv.project.targetAmount || 0),
                    status: inv.project.status || 'ACTIVE',
                    creatorId: inv.project.creatorId,
                    imageUrl: inv.project.imageUrl,
                };
            }
            return null;
        }).filter(Boolean);

        const uniqueIds = new Set();
        return projects.filter((p: any) => {
            const id = p.id || p._id;
            if (uniqueIds.has(id)) return false;
            uniqueIds.add(id);
            return true;
        });
    }, [allFetchedProjects, investmentsData]);

    const myInvestments = useMemo(() => myInvestmentProjects.filter((p: any) => {
        const type = (p?.projectType || p?.type || '').toUpperCase();
        return type !== 'CHARITY' && type !== '';
    }), [myInvestmentProjects]);

    const myDonations = useMemo(() => myInvestmentProjects.filter((p: any) => {
        const type = (p?.projectType || p?.type || '').toUpperCase();
        return type === 'CHARITY';
    }), [myInvestmentProjects]);

    const filteredCampaigns = useMemo(() => {
        if (!searchQuery.trim()) return myCampaigns;
        return myCampaigns.filter(p => {
            const name = p.name || p.title || '';
            return name.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [myCampaigns, searchQuery]);

    const displayedProjects = useMemo(() => {
        if (activeTab === 'investments') return myInvestments;
        if (activeTab === 'donations') return myDonations;
        return filteredCampaigns;
    }, [activeTab, myInvestments, myDonations, filteredCampaigns]);
    const isDataLoading = isLoading || isLoadingInvestments;

    // Calculate portfolio and donation stats
    const stats = useMemo(() => {
        if (!Array.isArray(investmentsData)) return { invested: 0, donated: 0, pos: 0, don: 0 };
        return investmentsData.reduce((acc, inv) => {
            const type = String(
                inv?.project?.type ?? ''
            ).toUpperCase();
            const amount = Number(inv?.amount ?? 0);
            if (!Number.isFinite(amount)) return acc;
            if (type === 'CHARITY') {
                acc.donated += amount;
                acc.don += 1;
            } else {
                acc.invested += amount;
                acc.pos += 1;
            }
            return acc;
        }, { invested: 0, donated: 0, pos: 0, don: 0 });
    }, [investmentsData]);

    const campaignsCreated = myCampaigns?.length || 0;
    const totalRaised = myCampaigns?.reduce((sum: number, p: any) => sum + (p.raisedAmount || 0), 0) || 0;

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
                        {/* KYC Banner */}
                        {/* KYC Removed */}

                        {/* Header / KPI Row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <KPICard
                                label="Total Invested (UGX)"
                                value={`${(stats.invested || 0).toLocaleString()}`}
                                icon={<LineChart size={16} className="text-emerald-500" />}
                            />
                            <KPICard
                                label="Total Donated (UGX)"
                                value={`${(stats.donated || 0).toLocaleString()}`}
                                icon={<Activity size={16} className="text-pink-500" />}
                            />
                            <KPICard
                                label="Active Investments"
                                value={stats.pos.toString()}
                                icon={<LayoutDashboard size={16} className="text-blue-500" />}
                            />
                            <KPICard
                                label="Campaigns Created"
                                value={campaignsCreated.toString()}
                                icon={<Briefcase size={16} className="text-indigo-500" />}
                            />
                        </div>

                        {/* Secondary KPI Row */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Total Raised from My Campaigns</p>
                                    <h4 className="text-2xl font-black text-[var(--text-main)]">UGX {totalRaised.toLocaleString()}</h4>
                                </div>
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                    <Activity className="text-blue-500" size={20} />
                                </div>
                            </div>
                            <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Charity Donations Made</p>
                                    <h4 className="text-2xl font-black text-[var(--text-main)]">{stats.don} Contributions</h4>
                                </div>
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                    <Shield className="text-emerald-500" size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Main Dashboard Container */}
                        <div className="bg-[var(--card)] rounded-[2rem] border border-[var(--border)] overflow-hidden shadow-sm transition-colors duration-300">
                            <div className="border-b border-[var(--border)] px-8">
                                <div className="flex items-center justify-between">
                                    <nav className="flex gap-10">
                                        {[
                                            { key: 'investments', label: 'Investments', icon: <Activity size={14} /> },
                                            { key: 'donations', label: 'Donations', icon: <Shield size={14} /> },
                                            { key: 'campaigns', label: 'My Projects', icon: <Briefcase size={14} /> },
                                            { key: 'nfts', label: 'My NFTs', icon: <ImageIcon size={14} /> }
                                        ].map(tab => (
                                            <button
                                                key={tab.key}
                                                onClick={() => setActiveTab(tab.key as any)}
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
                                {activeTab === 'investments' || activeTab === 'donations' ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold tracking-tight">
                                                {activeTab === 'investments' ? 'Your Investment Portfolio' : 'Your Charity Contributions'}
                                            </h3>
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
                                                    <Activity className="text-[var(--text-muted)]" size={24} />
                                                </div>
                                                <h4 className="text-lg font-bold">No {activeTab} yet</h4>
                                                <p className="text-sm text-[var(--text-muted)] font-medium max-w-xs mx-auto">
                                                    {activeTab === 'investments'
                                                        ? 'Start backing innovative projects and grow your portfolio.'
                                                        : 'Support causes that matter and make a difference.'}
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
                                            <h3 className="text-lg font-bold tracking-tight">Your Managed Projects</h3>
                                            <button
                                                onClick={handleTriggerCreate}
                                                className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm hover:underline"
                                            >
                                                <PlusCircle size={16} /> Create Campaign
                                            </button>
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
                                                    <Briefcase className="text-[var(--text-muted)]" size={24} />
                                                </div>
                                                <h4 className="text-lg font-bold">No Campaigns Yet</h4>
                                                <p className="text-sm text-[var(--text-muted)] font-medium max-w-xs mx-auto">
                                                    Launch your first campaign and bring your innovation to life.
                                                </p>
                                                <button onClick={handleTriggerCreate} className="button_primary inline-flex items-center gap-2 mt-4">
                                                    <PlusCircle size={16} /> Create Campaign
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <aside className="w-full lg:w-[380px] space-y-8">
                        <RightSidebar onTriggerCreate={handleTriggerCreate} />
                    </aside>

                </div>
            </main>

            <CreateProjectWizard isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
            <KYCModal isOpen={isKYCModalOpen} onClose={() => setIsKYCModalOpen(false)} />
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