"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ImageOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { isCharityProject } from "@/lib/roi-access";

interface ProjectCardProps {
  project: {
    _id?: string;
    id?: string;
    name?: string;
    title?: string;
    description?: string;
    summary?: string;
    imageUrl?: string;
    raisedAmount?: number;
    goalAmount?: number;
    targetAmount?: number;
    projectType?: "CHARITY" | "ROI";
    type?: string;
    status?: string;
    galleryImages?: string[];
  };
  onClick?: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const projectId = project._id || project.id;
  const projectName = project.name || project.title || "Untitled Project";
  const raised = project.raisedAmount || 0;
  const goal = project.goalAmount || project.targetAmount;
  const percentage =
    goal && goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  const isCharity = isCharityProject(project);

  const accentBg = isCharity ? "bg-emerald-600" : "bg-blue-600";
  const accentText = isCharity ? "text-emerald-600" : "text-blue-600";
  const accentHoverText = isCharity
    ? "group-hover:text-emerald-600"
    : "group-hover:text-blue-600";
  const accentHoverBg = isCharity
    ? "group-hover:bg-emerald-600"
    : "group-hover:bg-blue-600";

  return (
    <Link href={`/projects/${projectId}`}>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-sm transition-shadow hover:shadow-md cursor-pointer group h-full flex flex-col"
        onClick={onClick}
      >
        {/* Project Image */}
        <div className="relative h-48 bg-[var(--secondary)] overflow-hidden">
          {project.imageUrl ||
          (project.galleryImages && project.galleryImages[0]) ? (
            <Image
              src={project.imageUrl || project.galleryImages?.[0] || ""}
              alt={projectName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[var(--secondary)] text-[var(--text-muted)]">
              <ImageOff size={22} aria-hidden="true" />
            </div>
          )}

          {/* Project Type & Status Badge */}
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] shadow-sm ${accentBg} text-white`}
            >
              {isCharity ? "Charity" : "ROI"}
            </span>
            {project.status &&
              project.status !== "APPROVED" &&
              project.status !== "FUNDING" && (
                <span className="rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-md">
                  {project.status}
                </span>
              )}
          </div>
        </div>

        {/* Project Details */}
        <div className="flex flex-grow flex-col space-y-4 p-5">
          <div className="space-y-2 flex-grow">
            <h3
              className={`text-base font-semibold text-[var(--text-main)] ${accentHoverText} transition-colors line-clamp-2`}
            >
              {projectName}
            </h3>
            <p className="line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">
              {project.description ||
                project.summary ||
                "Campaign details are being prepared by the creator."}
            </p>
          </div>

          {/* Progress Bar Container */}
          <div className="pt-4 border-t border-[var(--border)] mt-auto space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold tabular-nums">
                <span className={accentText}>
                  UGX {raised.toLocaleString()}
                </span>
                <span className="text-[var(--text-muted)]">
                  {goal
                    ? `${percentage.toFixed(0)}% of UGX ${goal.toLocaleString()}`
                    : "Goal not published"}
                </span>
              </div>
              <div className="w-full bg-[var(--secondary)] rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${percentage}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className={`h-full ${accentBg} rounded-full`}
                />
              </div>
            </div>

            {/* View Details Button */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                View campaign
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-md bg-[var(--secondary)] transition-colors group-hover:text-white ${accentHoverBg}`}
              >
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
