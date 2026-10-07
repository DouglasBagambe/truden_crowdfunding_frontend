"use client";
import { homeCategories } from "@/lib/project-categories";

import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
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
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useRoiAccess } from "@/hooks/useRoiAccess";
import ProjectCard from "@/components/dashboard/ProjectCard";
import {
  filterVisibleProjects,
  isCharityProject,
  isROIProject,
} from "@/lib/roi-access";

export default function LandingPage() {
  const { data: projectsData, isLoading } = useProjects();
  const { hasRoiAccess } = useRoiAccess();
  const [activeTab, setActiveTab] = useState<"ALL" | "CHARITY" | "ROI">("ALL");
  const heroImages = useMemo(
    () => [
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1600&auto=format&fit=crop&q=80",
    ],
    [],
  );
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeroIndex((index) => (index + 1) % heroImages.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [heroImages]);

  const ugxFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-UG", {
        style: "currency",
        currency: "UGX",
        maximumFractionDigits: 0,
      }),
    [],
  );

  type LandingProject = React.ComponentProps<typeof ProjectCard>["project"];
  const projects = useMemo(
    () =>
      filterVisibleProjects(
        (projectsData?.items ?? []) as LandingProject[],
        hasRoiAccess,
      ),
    [projectsData, hasRoiAccess],
  );

  const charity = useMemo(() => projects.filter(isCharityProject), [projects]);

  const roi = useMemo(() => projects.filter(isROIProject), [projects]);

  const stats = useMemo(() => {
    const charityTotal = charity.reduce(
      (acc, project) => acc + (project.raisedAmount || 0),
      0,
    );
    const roiTotal = roi.reduce(
      (acc, project) => acc + (project.raisedAmount || 0),
      0,
    );
    return {
      charity: charityTotal,
      roi: roiTotal,
      charityCount: charity.length,
      roiCount: roi.length,
    };
  }, [charity, roi]);

  const visibleTab = !hasRoiAccess && activeTab === "ROI" ? "ALL" : activeTab;

  return (
    <div className="min-w-0 w-full overflow-x-clip bg-[var(--background)] min-h-screen flex flex-col pt-[68px] transition-colors duration-300">
      <Navbar />

      <main className="flex-grow">
        {/* ── Hero ── */}
        <section className="relative isolate min-h-[540px] overflow-hidden border-b border-[var(--border)] sm:min-h-[620px]">
          <div className="absolute inset-0 -z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroImages[heroIndex]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImages[heroIndex]})` }}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-slate-950/35" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/25 via-slate-950/40 to-slate-950/65" />
          </div>
          <div className="page-shell flex min-h-[540px] items-center py-16 text-center sm:min-h-[620px] sm:py-20">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mx-auto max-w-3xl space-y-5"
            >
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Back what matters.
                <br />
                Fund the future.
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-white/90 sm:text-lg">
                {hasRoiAccess
                  ? "Support charity causes making a real impact, or invest in businesses built for growth — all on one trusted platform."
                  : "Support charity causes making a real impact and help communities grow through trusted fundraising."}
              </p>
              <div className="flex flex-col justify-center gap-3 pt-3 sm:flex-row">
                <Link
                  href="/dashboard/create-project"
                  className="button_primary px-6 text-center"
                >
                  Start a Campaign
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/70 bg-white/90 px-6 text-sm font-semibold text-slate-900 transition-colors hover:bg-white"
                >
                  Explore Projects
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Filter Tabs ── */}
        <section className="bg-[var(--background)] border-b border-[var(--border)] py-5">
          <div className="page-shell flex justify-center">
            <div className="inline-flex gap-1 rounded-md border border-[var(--border)] bg-[var(--card)] p-1 shadow-sm">
              {(
                [
                  "ALL",
                  "CHARITY",
                  ...(hasRoiAccess ? (["ROI"] as const) : []),
                ] as const
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                    visibleTab === tab
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  {tab === "ALL"
                    ? "All Projects"
                    : tab === "CHARITY"
                      ? "Charity"
                      : "Investments"}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="bg-[var(--background)]">
          <div className="page-shell space-y-16 py-12 sm:py-16">
            {/* ── Charity Section ── */}
            {(visibleTab === "ALL" || visibleTab === "CHARITY") && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                      <Heart size={14} />
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                      Active Causes
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                    Give where it counts
                  </h2>
                  <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                    Every donation goes directly to verified causes — from
                    healthcare and education to community development across
                    Uganda and beyond.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {isLoading ? (
                    Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="h-80 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)]"
                        />
                      ))
                  ) : charity.length > 0 ? (
                    charity
                      .slice(0, 3)
                      .map((project) => (
                        <ProjectCard
                          key={project.id || project._id}
                          project={project}
                        />
                      ))
                  ) : (
                    <div className="col-span-3 py-16 text-center space-y-3">
                      <Heart
                        size={36}
                        className="mx-auto text-[var(--border)]"
                      />
                      <p className="text-[var(--text-muted)] font-medium">
                        No charity causes yet — be the first to start one.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  {stats.charityCount > 0 && (
                    <span className="text-sm text-[var(--text-muted)]">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {ugxFormatter.format(stats.charity)}
                      </span>{" "}
                      raised across {stats.charityCount} cause
                      {stats.charityCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  <div className="flex gap-2">
                    <Link
                      href="/explore?type=CHARITY"
                      className="button_secondary gap-2"
                    >
                      View all causes <ArrowRight size={15} />
                    </Link>
                    <Link
                      href="/dashboard/create-project"
                      className="inline-flex min-h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
                    >
                      Start a cause
                    </Link>
                  </div>
                </div>
              </motion.section>
            )}

            {/* ── ROI Section ── */}
            {hasRoiAccess && (visibleTab === "ALL" || visibleTab === "ROI") && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="space-y-10"
              >
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <TrendingUp size={14} />
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                      Investment Projects
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                    Back businesses that grow
                  </h2>
                  <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                    Invest in vetted startups and revenue-generating ventures
                    across Uganda. Transparent milestones, real returns.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {isLoading ? (
                    Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="h-80 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)]"
                        />
                      ))
                  ) : roi.length > 0 ? (
                    roi
                      .slice(0, 3)
                      .map((project) => (
                        <ProjectCard
                          key={project.id || project._id}
                          project={project}
                        />
                      ))
                  ) : (
                    <div className="col-span-3 py-16 text-center space-y-3">
                      <TrendingUp
                        size={36}
                        className="mx-auto text-[var(--border)]"
                      />
                      <p className="text-[var(--text-muted)] font-medium">
                        No investment projects yet — submit your startup.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  {stats.roiCount > 0 && (
                    <span className="text-sm text-[var(--text-muted)]">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {ugxFormatter.format(stats.roi)}
                      </span>{" "}
                      invested across {stats.roiCount} startup
                      {stats.roiCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  <div className="flex gap-2">
                    <Link
                      href="/explore?type=ROI"
                      className="button_secondary gap-2"
                    >
                      View investments <ArrowRight size={15} />
                    </Link>
                    <Link
                      href="/dashboard/create-project"
                      className="button_primary gap-2"
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
                <h2 className="text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                  Browse by category
                </h2>
                <p className="text-sm text-[var(--text-muted)]">
                  Find projects that match what you care about.
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {homeCategories.map((category, index) => (
                  <CategoryCard
                    key={category.href}
                    icon={
                      [
                        <Lightbulb key="school" />,
                        <GraduationCap key="ngo" />,
                        <UtensilsCrossed key="community" />,
                        <Leaf key="church" />,
                        <Palette key="individual" />,
                        <FlaskConical key="family" />,
                      ][index]
                    }
                    {...category}
                  />
                ))}
              </div>
            </section>

            {/* ── Bottom CTAs ── */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
              <div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
                <h3 className="text-xl font-semibold text-[var(--text-main)]">
                  Start a campaign
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {hasRoiAccess
                    ? "Whether it's a charity cause or a business looking for backers, Keibo gives you the tools to raise funds and grow."
                    : "Launch a charity campaign, tell your story clearly, and raise support from a wider community."}
                </p>
                <Link
                  href="/dashboard/create-project"
                  className="button_primary px-5"
                >
                  Start your campaign
                </Link>
              </div>

              <div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
                <h3 className="text-xl font-semibold text-[var(--text-main)]">
                  Find a campaign to support
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Browse current campaigns, understand the goal, and decide
                  where your support can be most useful.
                </p>
                <Link
                  href="/explore"
                  className="inline-flex min-h-10 items-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
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

function CategoryCard({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="flex cursor-pointer flex-col items-center gap-3 border border-[var(--border)] bg-[var(--card)] p-4 text-[var(--primary)] transition-colors duration-200 hover:border-[var(--primary)] hover:bg-[var(--secondary)]">
        <div className="[&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6 transition-transform group-hover:scale-110 duration-300">
          {icon}
        </div>
        <span className="text-center text-[10px] font-semibold uppercase tracking-wide leading-tight opacity-80 transition-opacity group-hover:opacity-100 sm:text-xs">
          {label}
        </span>
      </div>
    </Link>
  );
}
