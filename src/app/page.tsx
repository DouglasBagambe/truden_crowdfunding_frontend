'use client';

import React, { useState, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Heart, 
  TrendingUp, 
  Lightbulb,
  GraduationCap,
  UtensilsCrossed,
  Leaf,
  Palette,
  FlaskConical,
  Plus,
  Search
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import ProjectCard from '@/components/dashboard/ProjectCard';

export default function LandingPage() {
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const [filter, setFilter] = useState<'ALL' | 'CHARITY' | 'ROI'>('ALL');

  const allProjects = projectsData?.items || [];

  const charityProjects = useMemo(() => 
    allProjects.filter((p: any) => p.projectType === 'CHARITY'), 
  [allProjects]);

  const roiProjects = useMemo(() => 
    allProjects.filter((p: any) => p.projectType === 'ROI'), 
  [allProjects]);

  const displayedProjects = useMemo(() => {
    if (filter === 'CHARITY') return charityProjects;
    if (filter === 'ROI') return roiProjects;
    return allProjects;
  }, [allProjects, charityProjects, roiProjects, filter]);

  const stats = useMemo(() => {
    const totalRaised = allProjects.reduce((acc: number, p: any) => acc + (p.raisedAmount || 0), 0);
    const charityRaised = charityProjects.reduce((acc: number, p: any) => acc + (p.raisedAmount || 0), 0);
    const roiRaised = roiProjects.reduce((acc: number, p: any) => acc + (p.raisedAmount || 0), 0);
    
    return {
      total: totalRaised,
      charity: charityRaised,
      roi: roiRaised,
      count: allProjects.length,
      charityCount: charityProjects.length,
      roiCount: roiProjects.length
    };
  }, [allProjects, charityProjects, roiProjects]);

  return (
    <div className="bg-[var(--background)] min-h-screen flex flex-col pt-[72px] transition-colors duration-300">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden bg-[var(--secondary)]">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--primary)] opacity-10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--primary)] opacity-10 blur-[120px] rounded-full"></div>
          </div>
          
          <div className="container mx-auto px-6 relative z-10 text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              <h1 className="typography_h1">
                Your Ideas, Our Community, FundFlow
              </h1>
              <p className="text-lg lg:text-xl text-[var(--text-muted)] max-w-3xl mx-auto font-medium">
                Ignite your dreams and bring impactful projects to life with the support of a global community. 
                FundFlow makes crowdfunding simple and accessible.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target as HTMLFormElement;
                  const search = (target.elements.namedItem('search') as HTMLInputElement).value;
                  window.location.href = `/explore?search=${encodeURIComponent(search)}`;
                }}
                className="relative group mb-8"
              >
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                <input 
                  name="search"
                  type="text" 
                  placeholder="Search projects, categories, or creators..." 
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-[2rem] py-5 pl-16 pr-32 focus:outline-none focus:border-[var(--primary)] shadow-2xl shadow-blue-500/5 transition-all text-lg font-medium"
                />
                <button 
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 button_primary py-2.5 px-6 rounded-full text-sm font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700"
                >
                  Explore
                </button>
              </form>

              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/explore" className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline">
                  Browse Projects
                </Link>
                <span className="text-[var(--text-muted)]">•</span>
                <Link href="/register" className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)]">
                  Start a Campaign
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filters Tabs */}
        <section className="py-8 bg-[var(--background)] border-b border-[var(--border)]">
          <div className="container mx-auto px-6 flex justify-center">
            <div className="inline-flex bg-[var(--secondary)] p-1 rounded-lg gap-1">
              <FilterTab active={filter === 'ALL'} onClick={() => setFilter('ALL')} label="All" />
              <FilterTab active={filter === 'CHARITY'} onClick={() => setFilter('CHARITY')} label="Charity" />
              <FilterTab active={filter === 'ROI'} onClick={() => setFilter('ROI')} label="ROI" />
            </div>
          </div>
        </section>

        {/* Main Content Container */}
        <div className="bg-[var(--background)]">
          <div className="container mx-auto px-6 py-16 space-y-24">
            
            {/* Charity Section */}
            {(filter === 'ALL' || filter === 'CHARITY') && (
              <motion.section 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-12"
              >
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                    <Heart size={16} className="text-rose-600 dark:text-rose-400" />
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">Charity Projects</span>
                  </div>
                  <h2 className="typography_h2">
                    Make a Difference, One Donation at a Time
                  </h2>
                  <p className="typography_body text-lg">
                    Support causes that matter. Our charity projects focus on social impact, environmental sustainability, 
                    and community development. Every contribution helps build a better world.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {projectsLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="h-96 bg-[var(--secondary)] rounded-2xl animate-pulse" />
                    ))
                  ) : charityProjects.length > 0 ? (
                    charityProjects.slice(0, 3).map((project: any) => (
                      <ProjectCard key={project.id} project={project} />
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-[var(--text-muted)]">No charity projects available yet.</p>
                    </div>
                  )}
                </div>

                <div className="text-center space-y-6 pt-8">
                  <p className="text-xl font-bold text-[var(--text-main)]">
                    Total Impact: <span className="text-[var(--primary)]">${stats.charity.toLocaleString()}K Raised</span> | {stats.charityCount} Projects Funded
                  </p>
                  <button className="button_primary px-8 py-3.5 inline-flex items-center gap-2">
                    <Plus size={20} />
                    Create Charity Project
                  </button>
                </div>
              </motion.section>
            )}

            {/* ROI Section */}
            {(filter === 'ALL' || filter === 'ROI') && (
              <motion.section 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-12"
              >
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <TrendingUp size={16} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">ROI Projects</span>
                  </div>
                  <h2 className="typography_h2">
                    Invest in Innovation, Expect Returns
                  </h2>
                  <p className="typography_body text-lg">
                    Discover high-potential ventures designed for financial returns. Our ROI projects connect investors 
                    with innovative startups and growth opportunities across various industries.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {projectsLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="h-96 bg-[var(--secondary)] rounded-2xl animate-pulse" />
                    ))
                  ) : roiProjects.length > 0 ? (
                    roiProjects.slice(0, 3).map((project: any) => (
                      <ProjectCard key={project.id} project={project} />
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-[var(--text-muted)]">No ROI projects available yet.</p>
                    </div>
                  )}
                </div>

                <div className="text-center space-y-6 pt-8">
                  <p className="text-xl font-bold text-[var(--text-main)]">
                    Total Investment: <span className="text-[var(--primary)]">${stats.roi.toLocaleString()}M</span> | Avg. ROI: 15%
                  </p>
                  <button className="button_primary px-8 py-3.5 inline-flex items-center gap-2">
                    <Plus size={20} />
                    Create ROI Project
                  </button>
                </div>
              </motion.section>
            )}

            {/* Categories Section */}
            <section className="space-y-12 py-8">
              <div className="text-center">
                <h2 className="typography_h2">Explore Categories</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                <CategoryCard icon={<Lightbulb />} label="Technology" color="blue" />
                <CategoryCard icon={<GraduationCap />} label="Education" color="indigo" />
                <CategoryCard icon={<UtensilsCrossed />} label="Food & Craft" color="orange" />
                <CategoryCard icon={<Leaf />} label="Environment" color="green" />
                <CategoryCard icon={<Palette />} label="Arts & Culture" color="purple" />
                <CategoryCard icon={<FlaskConical />} label="Science" color="cyan" />
              </div>
            </section>

            {/* Bottom CTA Sections */}
            <section className="grid lg:grid-cols-2 gap-8 py-8">
              <div className="card_base bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40 space-y-6 text-center">
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold text-[var(--text-main)]">
                    Ready to Launch Your Vision?
                  </h3>
                  <p className="text-[var(--text-muted)]">
                    FundFlow provides the tools and community support you need to turn your innovative ideas into reality. 
                    Start your crowdfunding journey today.
                  </p>
                </div>
                <button className="button_primary px-8 py-3.5">
                  Start Your Campaign
                </button>
              </div>

              <div className="card_base bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40 space-y-6 text-center">
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold text-[var(--text-main)]">
                    Support Dreams, Make an Impact
                  </h3>
                  <p className="text-[var(--text-muted)]">
                    Discover groundbreaking projects and passionate creators. Your contribution can make a real difference 
                    in bringing new ideas to the world.
                  </p>
                </div>
                <button className="button_primary px-8 py-3.5">
                  Browse Projects
                </button>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

const FilterTab = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
      active 
        ? 'bg-[var(--primary)] text-white shadow-sm' 
        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
    }`}
  >
    {label}
  </button>
);

const CategoryCard = ({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) => {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300',
    indigo: 'text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300',
    orange: 'text-orange-600 dark:text-orange-400 group-hover:text-orange-700 dark:group-hover:text-orange-300',
    green: 'text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300',
    purple: 'text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300',
    cyan: 'text-cyan-600 dark:text-cyan-400 group-hover:text-cyan-700 dark:group-hover:text-cyan-300',
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-xl flex flex-col items-center gap-3 hover:border-[var(--primary)] hover:-translate-y-1 transition-all group cursor-pointer">
      <div className={`${colorClasses[color as keyof typeof colorClasses]} transition-colors`}>
        {icon}
      </div>
      <span className="text-sm font-bold text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors text-center">
        {label}
      </span>
    </div>
  );
};