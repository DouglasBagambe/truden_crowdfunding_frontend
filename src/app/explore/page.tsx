'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useProjects } from '@/hooks/useProjects';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { 
    Search, Filter, SlidersHorizontal, 
    Heart, TrendingUp, Zap, Globe, 
    ChevronDown, LayoutGrid, List,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExplorePage() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('ALL');
    const [projectType, setProjectType] = useState('ALL');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const queryParams = {
        search: search || undefined,
        category: category !== 'ALL' ? category : undefined,
        type: projectType !== 'ALL' ? projectType : undefined,
        // page, pageSize etc could be added here
    };

    const { data, isLoading } = useProjects(queryParams);
    const rawProjects = data?.projects || data?.items || [];
    
    // Normalize project IDs and add debugging
    const projects = rawProjects.map((project: any) => {
        const normalizedProject = {
            ...project,
            id: project.id || project._id
        };
        
        // Debug: Log projects without IDs
        if (!normalizedProject.id) {
            console.warn('[Explorer] Project missing ID:', project);
        }
        
        return normalizedProject;
    }).filter((p: any) => p.id); // Filter out projects without IDs

    const categories = [
        { id: 'ALL', label: 'All Projects', icon: <Globe size={16} /> },
        { id: 'TECHNOLOGY', label: 'Technology', icon: <Zap size={16} /> },
        { id: 'EDUCATION', label: 'Education', icon: <Zap size={16} /> },
        { id: 'ENVIRONMENT', label: 'Environment', icon: <Zap size={16} /> },
        { id: 'HEALTH', label: 'Health', icon: <Heart size={16} /> },
        { id: 'COMMUNITY', label: 'Community', icon: <Heart size={16} /> },
    ];

    return (
        <div className="bg-[var(--background)] min-h-screen text-[var(--text-main)]">
            <Navbar />

            <main className="pt-32 pb-24 container mx-auto px-6">
                {/* Header & Search */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tight">Project Explorer</h1>
                        <p className="text-[var(--text-muted)] font-medium">Discover the next generation of impact and innovation.</p>
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search projects, creators..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input_field pl-12"
                        />
                    </div>
                </header>

                {/* Filters Bar */}
                <div className="flex flex-wrap items-center justify-between gap-6 mb-12 py-6 border-y border-[var(--border)]">
                    <div className="flex flex-wrap items-center gap-3">
                        <FilterButton 
                            active={projectType === 'ALL'} 
                            onClick={() => setProjectType('ALL')} 
                            label="All Types" 
                        />
                        <FilterButton 
                            active={projectType === 'CHARITY'} 
                            onClick={() => setProjectType('CHARITY')} 
                            label="Charity" 
                            icon={<Heart size={14} />}
                        />
                        <FilterButton 
                            active={projectType === 'ROI'} 
                            onClick={() => setProjectType('ROI')} 
                            label="ROI" 
                            icon={<TrendingUp size={14} />}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-[var(--secondary)] p-1 rounded-xl">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[var(--card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[var(--card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>

                        <div className="relative group">
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-xs font-black uppercase tracking-widest hover:border-[var(--primary)] transition-all">
                                <span>Sort By: {sortBy}</span>
                                <ChevronDown size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {/* Sidebar Filters */}
                    <aside className="hidden lg:block space-y-10">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Categories</h3>
                            <div className="flex flex-col gap-1">
                                {categories.map((cat) => (
                                    <button 
                                        key={cat.id}
                                        onClick={() => setCategory(cat.id)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-sm ${category === cat.id ? 'bg-[var(--primary)] text-white shadow-lg shadow-blue-500/20' : 'text-[var(--text-muted)] hover:bg-[var(--secondary)]'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {cat.icon}
                                            {cat.label}
                                        </div>
                                        {category === cat.id && <motion.div layoutId="dot" className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-indigo-600 space-y-4 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20">
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold">Launch Today</h3>
                                <p className="text-indigo-100 text-xs font-medium leading-relaxed">
                                    Have a vision you want to share with the world? Start your campaign in minutes.
                                </p>
                                <button className="mt-6 w-full py-3 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-colors">
                                    Create Project
                                </button>
                            </div>
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        </div>
                    </aside>

                    {/* Project Grid */}
                    <div className="lg:col-span-3">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-4">
                                <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
                                <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px]">Scanning Distributed Ledger...</p>
                            </div>
                        ) : projects.length > 0 ? (
                            <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                <AnimatePresence mode="popLayout">
                                    {projects.map((project: any, idx: number) => (
                                        <motion.div 
                                            key={project.id || idx}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ProjectCard project={project} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="text-center py-32 space-y-4 bg-[var(--secondary)] rounded-[3rem] border-2 border-dashed border-[var(--border)]">
                                <Search className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-20" />
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold">No projects found</h3>
                                    <p className="text-[var(--text-muted)] font-medium italic">Try adjusting your filters or search terms.</p>
                                </div>
                                <button 
                                    onClick={() => { setSearch(''); setCategory('ALL'); setProjectType('ALL'); }}
                                    className="text-[var(--primary)] font-black uppercase tracking-widest text-[10px] hover:underline"
                                >
                                    Clear all filters
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
