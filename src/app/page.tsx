'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Lightbulb,
  GraduationCap,
  UtensilsCrossed,
  Leaf,
  Palette,
  FlaskConical,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import ProjectCard from '@/components/dashboard/ProjectCard';

export default function LandingPage() {
  const router = useRouter();
  const { data: projectsData, isLoading } = useProjects();
  const [activeTab, setActiveTab] = useState<'ALL' | 'CHARITY' | 'ROI'>('ALL');

  const ugxFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        maximumFractionDigits: 0,
      }),
    [],
  );

  const heroImages = useMemo(
    () => [
      'https://picsum.photos/seed/fundflow-hero-1/1600/900',
      'https://picsum.photos/seed/fundflow-hero-2/1600/900',
      'https://picsum.photos/seed/fundflow-hero-3/1600/900',
    ],
    [],
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

  const charity = useMemo(
    () => projects.filter((p: any) => p.projectType === 'CHARITY'),
    [projects],
  );

  const roi = useMemo(
    () => projects.filter((p: any) => p.projectType === 'ROI'),
    [projects],
  );

  const stats = useMemo(() => {
    const charityTotal = charity.reduce((acc: number, p: any) => acc + (p.raisedAmount || 0), 0);
    const roiTotal = roi.reduce((acc: number, p: any) => acc + (p.raisedAmount || 0), 0);
    return {
      charity: charityTotal,
      roi: roiTotal,
      charityCount: charity.length,
      roiCount: roi.length,
    };
  }, [charity, roi]);

  return (
    <div className="bg-[var(--background)] min-h-screen flex flex-col pt-[68px] transition-colors duration-300">
      <Navbar />

      <main className="flex-grow">

        {/* ── Hero ── */}
        <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
          <div className="absolute inset-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroImages[heroIndex]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${heroImages[heroIndex]})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                }}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-white/60 dark:bg-black/60" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/30 to-white/80 dark:from-black/5 dark:via-black/30 dark:to-black/80" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl mx-auto space-y-5"
            >
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight px-2">
                Fund what matters.<br className="hidden sm:block" /> Give. Invest. Grow.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto px-4 leading-relaxed">
                Keibo connects passionate creators with a community ready to support charity causes and back high-growth investments — all in one place.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 justify-center items-center px-4 mt-8"
            >
              <Link
                href="/dashboard/create-project"
                className="w-full sm:w-auto bg-[var(--primary)] hover:opacity-90 text-white font-semibold py-3 px-7 rounded-xl transition-all active:scale-[0.98] text-center text-sm sm:text-base"
              >
                Start a Campaign
              </Link>
              <Link
                href="/explore"
                className="w-full sm:w-auto bg-white/80 dark:bg-slate-900/60 backdrop-blur text-slate-900 dark:text-white font-semibold px-7 py-3 rounded-xl border border-white/50 dark:border-white/10 hover:bg-white dark:hover:bg-slate-900 transition-all text-center text-sm sm:text-base"
              >
                Explore Projects
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── Filter Tabs ── */}
        <section className="bg-[var(--background)] border-b border-[var(--border)] py-5">
          <div className="container mx-auto px-4 sm:px-6 flex justify-center">
            <div className="inline-flex gap-1 bg-[var(--card)] border border-[var(--border)] p-1 rounded-xl shadow-sm">
              {(['ALL', 'CHARITY', 'ROI'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {tab === 'ALL' ? 'All Projects' : tab === 'CHARITY' ? 'Charity' : 'Investments'}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="bg-[var(--background)]">
          <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-20">

            {/* ── Charity Section ── */}
            {(activeTab === 'ALL' || activeTab === 'CHARITY') && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="space-y-10"
              >
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                    <Heart size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Active Causes</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)]">
                    Give where it counts
                  </h2>
                  <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                    Every donation goes directly to verified causes — from healthcare and education to community development across Uganda and beyond.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {isLoading
                    ? Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-80 bg-[var(--card)] rounded-2xl animate-pulse border border-[var(--border)]" />
                      ))
                    : charity.length > 0
                      ? charity.slice(0, 3).map((project: any) => (
                          <ProjectCard key={project.id || project._id} project={project} />
                        ))
                      : (
                          <div className="col-span-3 py-16 text-center space-y-3">
                            <Heart size={36} className="mx-auto text-[var(--border)]" />
                            <p className="text-[var(--text-muted)] font-medium">No charity causes yet — be the first to start one.</p>
                          </div>
                        )
                  }
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  {stats.charityCount > 0 && (
                    <span className="text-sm text-[var(--text-muted)]">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{ugxFormatter.format(stats.charity)}</span> raised across {stats.charityCount} cause{stats.charityCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  <div className="flex gap-2">
                    <Link
                      href="/explore?type=CHARITY"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--card)] transition-all"
                    >
                      View all causes <ArrowRight size={15} />
                    </Link>
                    <Link
                      href="/dashboard/create-project"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
                    >
                      Start a cause
                    </Link>
                  </div>
                </div>
              </motion.section>
            )}

            {/* ── ROI Section ── */}
            {(activeTab === 'ALL' || activeTab === 'ROI') && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="space-y-10"
              >
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
                    <TrendingUp size={14} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Investment Projects</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)]">
                    Back businesses that grow
                  </h2>
                  <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                    Invest in vetted startups and revenue-generating ventures across Uganda. Transparent milestones, real returns.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {isLoading
                    ? Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-80 bg-[var(--card)] rounded-2xl animate-pulse border border-[var(--border)]" />
                      ))
                    : roi.length > 0
                      ? roi.slice(0, 3).map((project: any) => (
                          <ProjectCard key={project.id || project._id} project={project} />
                        ))
                      : (
                          <div className="col-span-3 py-16 text-center space-y-3">
                            <TrendingUp size={36} className="mx-auto text-[var(--border)]" />
                            <p className="text-[var(--text-muted)] font-medium">No investment projects yet — submit your startup.</p>
                          </div>
                        )
                  }
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  {stats.roiCount > 0 && (
                    <span className="text-sm text-[var(--text-muted)]">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{ugxFormatter.format(stats.roi)}</span> invested across {stats.roiCount} startup{stats.roiCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  <div className="flex gap-2">
                    <Link
                      href="/explore?type=ROI"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--card)] transition-all"
                    >
                      View investments <ArrowRight size={15} />
                    </Link>
                    <Link
                      href="/dashboard/create-project"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] hover:opacity-90 text-white transition-all"
                    >
                      Submit your startup
                    </Link>
                  </div>
                </div>
              </motion.section>
            )}

            {/* ── Categories ── */}
            <section className="space-y-8 py-2">
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)]">Browse by category</h2>
                <p className="text-sm text-[var(--text-muted)]">Find projects that match what you care about.</p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                <CategoryCard icon={<Lightbulb />} label="Technology" href="/explore?category=TECHNOLOGY" color="blue" />
                <CategoryCard icon={<GraduationCap />} label="Education" href="/explore?category=EDUCATION" color="indigo" />
                <CategoryCard icon={<UtensilsCrossed />} label="Food & Craft" href="/explore?category=COMMUNITY" color="amber" />
                <CategoryCard icon={<Leaf />} label="Environment" href="/explore?category=ENVIRONMENT" color="emerald" />
                <CategoryCard icon={<Palette />} label="Arts" href="/explore?category=COMMUNITY" color="rose" />
                <CategoryCard icon={<FlaskConical />} label="Health" href="/explore?category=HEALTH" color="cyan" />
              </div>
            </section>

            {/* ── Bottom CTAs ── */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-8 space-y-4 text-center">
                <h3 className="text-xl font-bold text-[var(--text-main)]">Ready to launch your idea?</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Whether it's a charity cause or a business looking for backers, Keibo gives you the tools to raise funds and grow.
                </p>
                <Link
                  href="/dashboard/create-project"
                  className="inline-block bg-[var(--primary)] hover:opacity-90 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
                >
                  Start your campaign
                </Link>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-8 space-y-4 text-center">
                <h3 className="text-xl font-bold text-[var(--text-main)]">Find something worth backing</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Explore verified projects from creators and entrepreneurs across Uganda. Your support changes lives.
                </p>
                <Link
                  href="/explore"
                  className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
                >
                  Explore projects
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

const colorMap: Record<string, string> = {
  blue:    'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 group-hover:border-blue-400',
  indigo:  'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40 group-hover:border-indigo-400',
  amber:   'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40 group-hover:border-amber-400',
  emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40 group-hover:border-emerald-400',
  rose:    'text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40 group-hover:border-rose-400',
  cyan:    'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-100 dark:border-cyan-900/40 group-hover:border-cyan-400',
};

function CategoryCard({ icon, label, color, href }: { icon: React.ReactNode; label: string; color: string; href: string }) {
  const cls = colorMap[color] || colorMap.blue;
  return (
    <Link href={href} className="group">
      <div className={`border rounded-2xl p-4 sm:p-5 flex flex-col items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${cls}`}>
        <div className="[&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6 transition-transform group-hover:scale-110 duration-300">
          {icon}
        </div>
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-center leading-tight opacity-80 group-hover:opacity-100 transition-opacity">
          {label}
        </span>
      </div>
    </Link>
  );
}