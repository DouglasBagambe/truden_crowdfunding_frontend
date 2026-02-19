'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useProjects } from '@/hooks/useProjects';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    Search, Filter, SlidersHorizontal, 
    Heart, TrendingUp, Zap, Globe, 
    ChevronDown, LayoutGrid, List,
    Loader2, Plus, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ExplorePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const parseStatuses = (raw: string | null) => {
        if (!raw) return [];
        const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
        return parts.length > 0 ? parts : [];
    };

    const initialApplied = useMemo(() => {
        const initialSearch = searchParams.get('search') || '';
        const initialCategory = searchParams.get('category') || 'ALL';
        const initialType = searchParams.get('type') || 'ALL';
        const initialStatuses = parseStatuses(searchParams.get('statuses'));
        const initialSort = searchParams.get('sort') || 'newest';
        return {
            search: initialSearch,
            category: initialCategory,
            projectType: initialType,
            statuses: initialStatuses,
            sortBy: initialSort,
        };
    }, [searchParams]);

    const [draftSearch, setDraftSearch] = useState(initialApplied.search);
    const [draftCategory, setDraftCategory] = useState(initialApplied.category);
    const [draftProjectType, setDraftProjectType] = useState(initialApplied.projectType);
    const [draftStatusFilters, setDraftStatusFilters] = useState<string[]>(initialApplied.statuses);
    const [draftSortBy, setDraftSortBy] = useState(initialApplied.sortBy);

    const [appliedSearch, setAppliedSearch] = useState(initialApplied.search);
    const [appliedCategory, setAppliedCategory] = useState(initialApplied.category);
    const [appliedProjectType, setAppliedProjectType] = useState(initialApplied.projectType);
    const [appliedStatusFilters, setAppliedStatusFilters] = useState<string[]>(initialApplied.statuses);
    const [appliedSortBy, setAppliedSortBy] = useState(initialApplied.sortBy);

    const buildExploreUrl = (next: {
        search: string;
        category: string;
        projectType: string;
        statuses: string[];
        sortBy: string;
    }) => {
        const sp = new URLSearchParams();
        if (next.search.trim()) sp.set('search', next.search.trim());
        if (next.category && next.category !== 'ALL') sp.set('category', next.category);
        if (next.projectType && next.projectType !== 'ALL') sp.set('type', next.projectType);
        if (next.statuses && next.statuses.length > 0) sp.set('statuses', next.statuses.join(','));
        if (next.sortBy && next.sortBy !== 'newest') sp.set('sort', next.sortBy);
        const qs = sp.toString();
        return qs ? `/explore?${qs}` : '/explore';
    };

    const applyFilters = (next?: Partial<{
        search: string;
        category: string;
        projectType: string;
        statuses: string[];
        sortBy: string;
    }>) => {
        const merged = {
            search: next?.search ?? draftSearch,
            category: next?.category ?? draftCategory,
            projectType: next?.projectType ?? draftProjectType,
            statuses: next?.statuses ?? draftStatusFilters,
            sortBy: next?.sortBy ?? draftSortBy,
        };

        setAppliedSearch(merged.search);
        setAppliedCategory(merged.category);
        setAppliedProjectType(merged.projectType);
        setAppliedStatusFilters(merged.statuses);
        setAppliedSortBy(merged.sortBy);

        router.replace(buildExploreUrl(merged));
    };

    const resetAll = () => {
        const defaults = {
            search: '',
            category: 'ALL',
            projectType: 'ALL',
            statuses: [],
            sortBy: 'newest',
        };

        setDraftSearch(defaults.search);
        setDraftCategory(defaults.category);
        setDraftProjectType(defaults.projectType);
        setDraftStatusFilters(defaults.statuses);
        setDraftSortBy(defaults.sortBy);

        setAppliedSearch(defaults.search);
        setAppliedCategory(defaults.category);
        setAppliedProjectType(defaults.projectType);
        setAppliedStatusFilters(defaults.statuses);
        setAppliedSortBy(defaults.sortBy);

        router.replace('/explore');
    };

    useEffect(() => {
        const nextSearch = searchParams.get('search') || '';
        const nextCategory = searchParams.get('category') || 'ALL';
        const nextType = searchParams.get('type') || 'ALL';
        const nextStatuses = parseStatuses(searchParams.get('statuses'));
        const nextSort = searchParams.get('sort') || 'newest';

        setDraftSearch(nextSearch);
        setDraftCategory(nextCategory);
        setDraftProjectType(nextType);
        setDraftStatusFilters(nextStatuses);
        setDraftSortBy(nextSort);

        setAppliedSearch(nextSearch);
        setAppliedCategory(nextCategory);
        setAppliedProjectType(nextType);
        setAppliedStatusFilters(nextStatuses);
        setAppliedSortBy(nextSort);
    }, [searchParams]);

    useEffect(() => {
        const t = setTimeout(() => {
            applyFilters({ search: draftSearch });
        }, 350);
        return () => clearTimeout(t);
    }, [draftSearch, draftCategory, draftProjectType, draftStatusFilters, draftSortBy]);

    const queryParams = useMemo(() => {
        return {
            search: appliedSearch || undefined,
            category: appliedCategory !== 'ALL' ? appliedCategory : undefined,
            type: appliedProjectType !== 'ALL' ? appliedProjectType : undefined,
            statuses: appliedStatusFilters.length > 0 ? appliedStatusFilters : undefined,
            sort: appliedSortBy !== 'newest' ? appliedSortBy : undefined,
        };
    }, [appliedSearch, appliedCategory, appliedProjectType, appliedStatusFilters, appliedSortBy]);

    const { data, isLoading } = useProjects(queryParams);
    const rawProjects = data?.projects || data?.items || [];
    
    const projects = rawProjects.map((project: any) => ({
        ...project,
        id: project.id || project._id
    })).filter((p: any) => p.id);

    const categories = [
        { id: 'ALL', label: 'All Categories' },
        { id: 'TECHNOLOGY', label: 'Technology' },
        { id: 'EDUCATION', label: 'Education' },
        { id: 'HEALTH', label: 'Health' },
        { id: 'AGRICULTURE', label: 'Agriculture' },
        { id: 'ENERGY', label: 'Energy' },
        { id: 'ENVIRONMENT', label: 'Environment' },
        { id: 'COMMUNITY', label: 'Community' },
    ];

    const toggleStatus = (status: string) => {
        setDraftStatusFilters(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const isCharitySelected = draftProjectType === 'CHARITY';
    const accent = {
        focusText: isCharitySelected ? 'group-focus-within:text-emerald-500' : 'group-focus-within:text-blue-500',
        focusRing: isCharitySelected ? 'focus:ring-emerald-500/10 focus:border-emerald-500' : 'focus:ring-blue-500/10 focus:border-blue-500',
        hoverBorder: isCharitySelected ? 'hover:border-emerald-500' : 'hover:border-blue-500',
        radioOn: isCharitySelected ? 'border-emerald-600 bg-emerald-600' : 'border-blue-600 bg-blue-600',
        radioOff: isCharitySelected ? 'group-hover:border-emerald-400' : 'group-hover:border-blue-400',
        checkboxOn: isCharitySelected ? 'border-emerald-600 bg-emerald-600' : 'border-blue-600 bg-blue-600',
        checkboxOff: isCharitySelected ? 'group-hover:border-emerald-400' : 'group-hover:border-blue-400',
        newButton: isCharitySelected ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700',
    };

    return (
        <div className="bg-[var(--background)] min-h-screen text-[var(--text-main)]">
            <Navbar />

            <main className="pt-28 pb-20 container mx-auto px-6 lg:px-12">
                {/* Search & Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <div className="relative w-full md:max-w-xl group">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] ${accent.focusText} transition-colors`} />
                        <input 
                            type="text" 
                            placeholder="Search projects by title or description..." 
                            value={draftSearch}
                            onChange={(e) => setDraftSearch(e.target.value)}
                            className={`w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl py-4 pl-12 pr-4 focus:ring-4 ${accent.focusRing} outline-none transition-all shadow-sm font-medium`}
                        />
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <select 
                            value={draftSortBy}
                            onChange={(e) => setDraftSortBy(e.target.value)}
                            className={`bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--text-muted)] outline-none transition-all shadow-sm cursor-pointer ${accent.hoverBorder}`}
                        >
                            <option value="newest">Newest First</option>
                            <option value="ending">Ending Soon</option>
                            <option value="funded">Most Funded</option>
                        </select>
                        <Link href="/create-project" className={`${accent.newButton} text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg text-sm whitespace-nowrap`}>
                            <Plus size={18} />
                            <span>New Project</span>
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar Filters */}
                    <aside className="lg:w-80 space-y-8 flex-shrink-0">
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-8 space-y-10 shadow-sm">
                            <h2 className="text-xl font-black tracking-tight border-b border-[var(--border)] pb-4">Filters</h2>

                            {/* Active Filters */}
                            {(appliedSearch.trim() || appliedCategory !== 'ALL' || appliedProjectType !== 'ALL' || appliedStatusFilters.length > 0 || appliedSortBy !== 'newest') && (
                                <div className="flex flex-wrap gap-2">
                                    {appliedProjectType !== 'ALL' && (
                                        <button
                                            onClick={() => applyFilters({ projectType: 'ALL' })}
                                            className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[var(--secondary)] text-[var(--text-main)] border border-[var(--border)] hover:opacity-90"
                                        >
                                            Type: {appliedProjectType}
                                        </button>
                                    )}
                                    {appliedCategory !== 'ALL' && (
                                        <button
                                            onClick={() => applyFilters({ category: 'ALL' })}
                                            className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[var(--secondary)] text-[var(--text-main)] border border-[var(--border)] hover:opacity-90"
                                        >
                                            Category: {appliedCategory}
                                        </button>
                                    )}
                                    {appliedSearch.trim() && (
                                        <button
                                            onClick={() => applyFilters({ search: '' })}
                                            className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[var(--secondary)] text-[var(--text-main)] border border-[var(--border)] hover:opacity-90"
                                        >
                                            Search: “{appliedSearch.trim()}”
                                        </button>
                                    )}
                                </div>
                            )}
                            
                            {/* Project Type */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Project Type</h3>
                                <div className="space-y-3">
                                    {['ALL', 'ROI', 'CHARITY'].map((type) => (
                                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${draftProjectType === type ? accent.radioOn : `border-[var(--border)] ${accent.radioOff}`}`}>
                                                {draftProjectType === type && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                            <input 
                                                type="radio" 
                                                className="hidden" 
                                                name="projectType" 
                                                checked={draftProjectType === type}
                                                onChange={() => setDraftProjectType(type)}
                                            />
                                            <span className={`text-sm font-bold transition-colors ${draftProjectType === type ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
                                                {type === 'ALL' ? 'All Projects' : type === 'ROI' ? 'ROI Projects' : 'Charity Projects'}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Status</h3>
                                <div className="space-y-3">
                                    {[
                                        { id: 'APPROVED', label: 'Newly Posted' },
                                        { id: 'FUNDING', label: 'Open Projects' },
                                        { id: 'FUNDED', label: 'Funded' },
                                        { id: 'COMPLETED', label: 'Completed' },
                                    ].map((status) => (
                                        <label key={status.id} className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${draftStatusFilters.includes(status.id) ? accent.checkboxOn : `border-[var(--border)] ${accent.checkboxOff}`}`}>
                                                {draftStatusFilters.includes(status.id) && <Plus size={14} className="text-white" />}
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                className="hidden" 
                                                checked={draftStatusFilters.includes(status.id)}
                                                onChange={() => toggleStatus(status.id)}
                                            />
                                            <span className={`text-sm font-bold transition-colors ${draftStatusFilters.includes(status.id) ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
                                                {status.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Category Dropdown */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Category</h3>
                                <select 
                                    value={draftCategory}
                                    onChange={(e) => setDraftCategory(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex gap-3">
                                <button 
                                    onClick={resetAll}
                                    className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => applyFilters()}
                                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>

                        {/* Promo Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2rem] p-8 text-white space-y-4 relative overflow-hidden shadow-xl shadow-indigo-500/20">
                            <Zap className="w-12 h-12 text-indigo-200 opacity-50 mb-2" />
                            <h3 className="text-2xl font-black leading-tight">Ignite your project.</h3>
                            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                                Get featured to 50k+ daily investors and donors on our platform.
                            </p>
                            <button className="w-full py-4 bg-white text-indigo-700 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">
                                Boost Project
                            </button>
                            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        </div>
                    </aside>

                    {/* Project Grid */}
                    <div className="flex-grow">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="h-[28rem] bg-white rounded-[2rem] animate-pulse border border-slate-200 shadow-sm" />
                                ))}
                            </div>
                        ) : projects.length > 0 ? (
                            <div className="space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                    <AnimatePresence mode="popLayout">
                                        {projects.map((project: any, idx: number) => (
                                            <motion.div 
                                                key={project.id || idx}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.3, delay: idx * 0.05 }}
                                            >
                                                <ProjectCard project={project} />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                                
                                {/* Pagination */}
                                <div className="flex justify-center items-center gap-3 pt-8 pb-12">
                                    <button className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm">
                                        <ArrowRight size={20} className="rotate-180" />
                                    </button>
                                    {[1, 2, 3].map((page) => (
                                        <button key={page} className={`w-12 h-12 rounded-xl font-bold transition-all shadow-sm ${page === 1 ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-600'}`}>
                                            {page}
                                        </button>
                                    ))}
                                    <button className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm">
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-40 space-y-6 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-sm">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                                    <Search className="w-10 h-10 text-slate-300" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black tracking-tight text-slate-900">No projects match your search.</h3>
                                    <p className="text-slate-500 font-medium max-w-sm">We couldn't find any results for your current filters. Try resetting them or searching for something else.</p>
                                </div>
                                <button 
                                    onClick={resetAll}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 hover:scale-105"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

const FilterButton = ({ active, onClick, label, icon }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-[var(--primary)] text-white shadow-lg shadow-blue-500/10' : 'bg-[var(--card)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--primary)]/50'}`}
    >
        {icon}
        {label}
    </button>
);
