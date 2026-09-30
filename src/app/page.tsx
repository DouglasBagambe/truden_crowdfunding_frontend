"use client";

import React, { useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
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
    <div className="bg-[var(--background)] min-h-screen flex flex-col pt-[68px] transition-colors duration-300">
      <Navbar />

      <main className="flex-grow">
        {/* ── Hero ── */}
        <section className="border-b border-[var(--border)] bg-[var(--card)]">
          <div className="page-shell py-16 sm:py-20 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl space-y-5"
            >
              <p className="eyebrow text-[var(--primary)]">
                Campaign funding, made clearer
              </p>
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-[var(--text-main)] sm:text-4xl lg:text-5xl leading-tight">
                Back the work you believe in.
              </h1>
              <p className="max-w-xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
                {hasRoiAccess
                  ? "Explore charity campaigns and eligible investment opportunities with the context needed to make informed decisions."
                  : "Explore charity campaigns, follow their progress, and support causes that matter to you."}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="mt-7 flex flex-col items-start gap-3 sm:flex-row"
            >
              <Link
                href="/dashboard/create-project"
                className="button_primary w-full sm:w-auto px-5 text-center"
              >
                Start a Campaign
              </Link>
              <Link
                href="/explore"
                className="button_secondary w-full sm:w-auto px-5 text-center"
              >
                Explore Projects
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── Filter Tabs ── */}
        <section className="bg-[var(--background)] border-b border-[var(--border)] py-5">
          <div className="page-shell">
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
                <CategoryCard
                  icon={<Lightbulb />}
                  label="Technology"
                  href="/explore?category=TECHNOLOGY"
                  color="blue"
                />
                <CategoryCard
                  icon={<GraduationCap />}
                  label="Education"
                  href="/explore?category=EDUCATION"
                  color="indigo"
                />
                <CategoryCard
                  icon={<UtensilsCrossed />}
                  label="Food & Craft"
                  href="/explore?category=COMMUNITY"
                  color="amber"
                />
                <CategoryCard
                  icon={<Leaf />}
                  label="Environment"
                  href="/explore?category=ENVIRONMENT"
                  color="emerald"
                />
                <CategoryCard
                  icon={<Palette />}
                  label="Arts"
                  href="/explore?category=COMMUNITY"
                  color="rose"
                />
                <CategoryCard
                  icon={<FlaskConical />}
                  label="Health"
                  href="/explore?category=HEALTH"
                  color="cyan"
                />
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

const colorMap: Record<string, string> = {
  blue: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 group-hover:border-blue-400",
  indigo:
    "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40 group-hover:border-indigo-400",
  amber:
    "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40 group-hover:border-amber-400",
  emerald:
    "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40 group-hover:border-emerald-400",
  rose: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40 group-hover:border-rose-400",
  cyan: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-100 dark:border-cyan-900/40 group-hover:border-cyan-400",
};

function CategoryCard({
  icon,
  label,
  color,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  href: string;
}) {
  const cls = colorMap[color] || colorMap.blue;
  return (
    <Link href={href} className="group">
      <div
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${cls}`}
      >
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
