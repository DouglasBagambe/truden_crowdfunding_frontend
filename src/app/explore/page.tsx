'use client';

import React, { useState, useEffect } from 'react';
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
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState(searchParams.get('category') || 'ALL');
    const [projectType, setProjectType] = useState(searchParams.get('type') || 'ALL');
    const [statusFilters, setStatusFilters] = useState<string[]>(['FUNDING']);
    const [sortBy, setSortBy] = useState('newest');
    const [range, setRange] = useState(100);

    const queryParams = {
        search: search || undefined,
        category: category !== 'ALL' ? category : undefined,
        type: projectType !== 'ALL' ? projectType : undefined,
        status: statusFilters.length > 0 ? statusFilters[0] : undefined,
    };

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
        setStatusFilters(prev => 
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen text-slate-900">
            <Navbar />

            <main className="pt-28 pb-20 container mx-auto px-6 lg:px-12">
                {/* Search & Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <div className="relative w-full md:max-w-xl group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search projects by title or description..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm font-medium"
                        />
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-600 outline-none hover:border-blue-500 transition-all shadow-sm cursor-pointer"
                        >
                            <option value="newest">Newest First</option>
                            <option value="ending">Ending Soon</option>
                            <option value="funded">Most Funded</option>
                        </select>
                        <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 text-sm whitespace-nowrap">
                            <Plus size={18} />
                            <span>New Project</span>
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar Filters */}
                    <aside className="lg:w-80 space-y-8 flex-shrink-0">
                        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-10 shadow-sm">
                            <h2 className="text-xl font-black tracking-tight border-b border-slate-100 pb-4">Filters</h2>
                            
                            {/* Project Type */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Project Type</h3>
                                <div className="space-y-3">
                                    {['ALL', 'ROI', 'CHARITY'].map((type) => (
                                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${projectType === type ? 'border-blue-600 bg-blue-600' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                                {projectType === type && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                            <input 
                                                type="radio" 
                                                className="hidden" 
                                                name="projectType" 
                                                checked={projectType === type}
                                                onChange={() => setProjectType(type)}
                                            />
                                            <span className={`text-sm font-bold transition-colors ${projectType === type ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                                                {type === 'ALL' ? 'All Projects' : type === 'ROI' ? 'ROI Projects' : 'Charity Projects'}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Status</h3>
                                <div className="space-y-3">
                                    {[
                                        { id: 'FUNDING', label: 'Open Projects' },
                                        { id: 'FUNDED', label: 'Funded' },
                                        { id: 'CLOSED', label: 'Completed' },
                                    ].map((status) => (
                                        <label key={status.id} className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${statusFilters.includes(status.id) ? 'border-blue-600 bg-blue-600' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                                {statusFilters.includes(status.id) && <Plus size={14} className="text-white" />}
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                className="hidden" 
                                                checked={statusFilters.includes(status.id)}
                                                onChange={() => toggleStatus(status.id)}
                                            />
                                            <span className={`text-sm font-bold transition-colors ${statusFilters.includes(status.id) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
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
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Range Slider */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Target Reached</h3>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{range}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={range}
                                    onChange={(e) => setRange(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-[10px] font-black text-slate-300">
                                    <span>0%</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex gap-3">
                                <button 
                                    onClick={() => { setSearch(''); setCategory('ALL'); setProjectType('ALL'); setStatusFilters(['ACTIVE']); setRange(100); }}
                                    className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
                                >
                                    Reset
                                </button>
                                <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md">
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
                                    onClick={() => { setSearch(''); setCategory('ALL'); setProjectType('ALL'); }}
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
