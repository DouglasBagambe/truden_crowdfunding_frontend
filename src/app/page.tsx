'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowRight
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import ProjectCard from '@/components/dashboard/ProjectCard';

export default function LandingPage() {
  const { data: projectsData, isLoading } = useProjects();
  const [activeTab, setActiveTab] = useState<'ALL' | 'CHARITY' | 'ROI'>('ALL');
  const heroImages = useMemo(
    () => [
      'https://picsum.photos/seed/fundflow-hero-1/1600/900',
      'https://picsum.photos/seed/fundflow-hero-2/1600/900',
      'https://picsum.photos/seed/fundflow-hero-3/1600/900',
    ],
    []
  );
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages]);

  const projects = projectsData?.items || [];

  const charity = useMemo(() => 
    projects.filter((p: any) => p.projectType === 'CHARITY'), 
  [projects]);

  const roi = useMemo(() => 
    projects.filter((p: any) => p.projectType === 'ROI'), 
  [projects]);

  const stats = useMemo(() => {
    const charityTotal = charity.reduce((acc: number, p: any) => acc + (p.raisedAmount || 0), 0);
    const roiTotal = roi.reduce((acc: number, p: any) => acc + (p.raisedAmount || 0), 0);
    
    return {
      charity: charityTotal,
      roi: roiTotal,
      charityCount: charity.length,
      roiCount: roi.length
    };
  }, [charity, roi]);

  return (
    <div className="bg-[var(--background)] min-h-screen flex flex-col pt-[72px] transition-colors duration-300">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroImages[heroIndex]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, scale: 1.03 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${heroImages[heroIndex]})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                }}
              />
            </AnimatePresence>

            <div className="absolute inset-0 bg-white/65 dark:bg-black/55" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/40 to-white/70 dark:from-black/10 dark:via-black/40 dark:to-black/70" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/35 via-transparent to-white/20 dark:from-black/35 dark:via-transparent dark:to-black/20" />
          </div>
          <div className="container mx-auto px-6 relative z-10 text-center space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 dark:text-white"
                style={{ textShadow: '0 10px 35px rgba(0,0,0,0.22)' }}
              >
                Your Ideas, Our Community, FundFlow
              </h1>
              <p
                className="text-lg max-w-3xl mx-auto text-slate-700 dark:text-slate-200"
                style={{ textShadow: '0 10px 30px rgba(0,0,0,0.14)' }}
              >
                Ignite your dreams and bring impactful projects to life with the support of a global community. FundFlow makes crowdfunding simple and accessible.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-4 justify-center flex-wrap"
            >
              <Link href="/explore" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-sm hover:shadow">
                Browse Projects
              </Link>
              <Link href="/create-project" className="bg-white/85 dark:bg-slate-900/65 backdrop-blur text-slate-950 dark:text-white font-semibold px-8 py-3 rounded-xl border border-white/40 dark:border-white/10 hover:bg-white dark:hover:bg-slate-900 transition-colors shadow-sm hover:shadow">
                Create a Campaign
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Filter Tabs */}
        <section className="bg-[var(--background)] border-b border-[var(--border)] py-6">
          <div className="container mx-auto px-6 flex justify-center">
            <div className="inline-flex gap-2">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'ALL' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('CHARITY')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'CHARITY' 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Charity
              </button>
              <button
                onClick={() => setActiveTab('ROI')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'ROI' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                ROI
              </button>
            </div>
          </div>
        </section>

        <div className="bg-[var(--background)]">
          <div className="container mx-auto px-6 py-16 space-y-20">
            
            {/* Charity Section */}
            {(activeTab === 'ALL' || activeTab === 'CHARITY') && (
              <motion.section 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-10"
              >
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-[var(--border)]">
                    <Heart size={16} className="text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-600">Charity Projects</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-main)]">
                    Make a Difference, One Donation at a Time
                  </h2>
                  <p className="text-base text-[var(--text-muted)]">
                    Support causes that matter. Our charity projects focus on social impact, environmental sustainability, and community development. Every contribution helps build a better world.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="h-96 bg-[var(--card)] rounded-xl animate-pulse border border-[var(--border)]" />
                    ))
                  ) : charity.length > 0 ? (
                    charity.slice(0, 3).map((project: any) => (
                      <ProjectCard key={project.id || project._id} project={project} />
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-[var(--text-muted)]">No charity projects available yet.</p>
                    </div>
                  )}
                </div>

                <div className="text-center space-y-4 pt-6">
                  <p className="text-lg font-semibold text-[var(--text-main)]">
                    Total Impact: <span className="text-emerald-600">${stats.charity.toLocaleString()}K Raised</span> | {stats.charityCount} Projects Funded
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Link href="/explore?type=CHARITY" className="px-8 py-3 rounded-lg inline-flex items-center gap-2 font-semibold border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors">
                      Explore more charity
                      <ArrowRight size={18} />
                    </Link>
                    <Link href="/create-project" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-lg inline-flex items-center gap-2 transition-colors">
                      <Plus size={20} />
                      Create Charity Project
                    </Link>
                  </div>
                </div>
              </motion.section>
            )}

            {/* ROI Section */}
            {(activeTab === 'ALL' || activeTab === 'ROI') && (
              <motion.section 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-10"
              >
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-[var(--border)]">
                    <TrendingUp size={16} className="text-blue-600" />
                    <span className="text-sm font-semibold text-blue-600">ROI Projects</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-main)]">
                    Invest in Innovation, Expect Returns
                  </h2>
                  <p className="text-base text-[var(--text-muted)]">
                    Discover high-potential ventures designed for financial returns. Our ROI projects connect investors with innovative startups and growth opportunities across various industries.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="h-96 bg-[var(--card)] rounded-xl animate-pulse border border-[var(--border)]" />
                    ))
                  ) : roi.length > 0 ? (
                    roi.slice(0, 3).map((project: any) => (
                      <ProjectCard key={project.id || project._id} project={project} />
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-[var(--text-muted)]">No ROI projects available yet.</p>
                    </div>
                  )}
                </div>

                <div className="text-center space-y-4 pt-6">
                  <p className="text-lg font-semibold text-[var(--text-main)]">
                    Total Investment: <span className="text-blue-600">${stats.roi.toLocaleString()}M</span> | Avg. ROI: 15%
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Link href="/explore?type=ROI" className="px-8 py-3 rounded-lg inline-flex items-center gap-2 font-semibold border border-blue-600/30 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
                      Explore more ROI
                      <ArrowRight size={18} />
                    </Link>
                    <Link href="/create-project" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg inline-flex items-center gap-2 transition-colors">
                      <Plus size={20} />
                      Create ROI Project
                    </Link>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Categories */}
            <section className="space-y-12 py-8 text-center">
              <div className="space-y-4 max-w-2xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">Explore Categories</h2>
                <p className="text-gray-500 font-medium">Find projects that align with your passions and investment goals.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                <Category 
                  icon={<Lightbulb className="w-8 h-8" />} 
                  label="Technology" 
                  href="/explore?category=TECHNOLOGY"
                  color="blue" 
                />
                <Category 
                  icon={<GraduationCap className="w-8 h-8" />} 
                  label="Education" 
                  href="/explore?category=EDUCATION"
                  color="indigo" 
                />
                <Category 
                  icon={<UtensilsCrossed className="w-8 h-8" />} 
                  label="Food & Craft" 
                  href="/explore?category=COMMUNITY"
                  color="amber" 
                />
                <Category 
                  icon={<Leaf className="w-8 h-8" />} 
                  label="Environment" 
                  href="/explore?category=ENVIRONMENT"
                  color="emerald" 
                />
                <Category 
                  icon={<Palette className="w-8 h-8" />} 
                  label="Arts & Culture" 
                  href="/explore?category=COMMUNITY"
                  color="rose" 
                />
                <Category 
                  icon={<FlaskConical className="w-8 h-8" />} 
                  label="Health" 
                  href="/explore?category=HEALTH"
                  color="cyan" 
                />
              </div>
            </section>

            {/* Bottom CTAs */}
            <section className="grid lg:grid-cols-2 gap-6 py-8">
              <div className="bg-blue-50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-10 space-y-6 text-center">
                <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-main)]">
                  Ready to Launch Your Vision?
                </h3>
                <p className="text-[var(--text-muted)] text-base">
                  FundFlow provides the tools and community support you need to turn your innovative ideas into reality. Start your crowdfunding journey today.
                </p>
                <Link href="/create-project" className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-semibold px-8 py-3 rounded-lg inline-block transition-colors">
                  Start Your Campaign
                </Link>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-10 space-y-6 text-center">
                <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-main)]">
                  Support Dreams, Make an Impact
                </h3>
                <p className="text-[var(--text-muted)] text-base">
                  Discover groundbreaking projects and passionate creators. Your contribution can make a real difference in bringing new ideas to the world.
                </p>
                <Link href="/explore" className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-semibold px-8 py-3 rounded-lg inline-block transition-colors">
                  Browse Projects
                </Link>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Category({ icon, label, color, href }: { icon: React.ReactNode, label: string, color: string, href: string }) {
  return (
    <Link href={href}>
      <div className="bg-white border border-gray-100 p-8 rounded-3xl flex flex-col items-center gap-4 hover:border-blue-500 hover:shadow-xl hover:-translate-y-2 transition-all group cursor-pointer shadow-sm">
        <div className="text-blue-500 transition-transform group-hover:scale-110 duration-500">
          {icon}
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors text-center">
          {label}
        </span>
      </div>
    </Link>
  );
}