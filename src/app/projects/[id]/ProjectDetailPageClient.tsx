'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Calendar, Users, Clock, CheckCircle, AlertCircle,
    Heart, Share2, Bookmark, Globe, TrendingUp, BarChart3,
    Flag, Loader2, CheckCircle2, ExternalLink, X, Smartphone, Copy, Link2
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import { projectService } from '@/lib/project-service';
import { useAuth } from '@/hooks/useAuth';
import { useRoiAccess } from '@/hooks/useRoiAccess';
import { isCharityProject, isROIProject } from '@/lib/roi-access';
import toast from 'react-hot-toast';
import DPOPaymentModal from '@/components/payments/DPOPaymentModal';

function ExpandableStory({ story }: { story: string }) {
    const [expanded, setExpanded] = useState(false);
    const trimmedStory = story.trim();
    const isLong = trimmedStory.length > 900;
    const visibleStory = !isLong || expanded ? trimmedStory : `${trimmedStory.slice(0, 900).trimEnd()}...`;

    return (
        <div className="bg-[var(--card)] p-8 rounded-3xl border border-[var(--border)] leading-loose text-lg space-y-4">
            {visibleStory.split('\n').map((para: string, i: number) => (
                <p key={i} className="text-[var(--text-main)] break-words whitespace-pre-wrap">{para}</p>
            ))}
            {isLong && (
                <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    className="mt-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-black uppercase tracking-widest text-[var(--primary)] transition-all hover:bg-[var(--secondary)] focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/20"
                    aria-expanded={expanded}
                >
                    {expanded ? 'Read Less' : 'Read More'}
                </button>
            )}
        </div>
    );
}

export default function ProjectDetailPageClient() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const { isAuthenticated, user } = useAuth();
    const { hasRoiAccess } = useRoiAccess();

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'story' | 'timeline' | 'updates'>('story');
    const [bookmarked, setBookmarked] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isSubmittingForReview, setIsSubmittingForReview] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Donors (charity projects)
    const [donors, setDonors] = useState<any[]>([]);
    const [donorsLoading, setDonorsLoading] = useState(false);

    const isCharity = isCharityProject(project);
    const isRoi = isROIProject(project);

    const [mediaIndex, setMediaIndex] = useState(0);
    const mediaItems = project ? [
        ...(project.imageUrl ? [{ type: 'image', url: project.imageUrl }] : []),
        ...(project.galleryImages || []).map((url: string) => ({ type: 'image', url })),
        ...(project.videoUrls || []).map((url: string) => ({ type: 'video', url })),
    ] : [];
    const currentMedia = mediaItems[mediaIndex];

    const openDonateModal = () => {
        setIsPaymentModalOpen(true);
    };

    const openInvestModal = () => {
        if (!isAuthenticated) {
            window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
            return;
        }
        setIsPaymentModalOpen(true);
    };

    useEffect(() => {
        if (projectId && projectId !== 'undefined') {
            loadProject();
        } else {
            setError('Invalid project ID');
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (projectId && projectId !== 'undefined' && isCharity) {
            loadDonors();
        }
    }, [projectId, isCharity]);

    useEffect(() => {
        if (!loading && project && isRoi && !hasRoiAccess) {
            toast.error('ROI projects are currently available to internal users only.');
            router.replace('/explore');
        }
    }, [hasRoiAccess, isRoi, loading, project, router]);

    useEffect(() => {
        setMediaIndex(0);
    }, [project]);

    const loadProject = async () => {
        try {
            setLoading(true);
            const data = await projectService.getProject(projectId);
            // Handle backend response structure { project, milestones }
            if (data && data.project) {
                setProject({ ...data.project, milestones: data.milestones || data.project.milestones || [] });
            } else {
                setProject(data);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Project not found');
        } finally {
            setLoading(false);
        }
    };

    const loadDonors = async () => {
        try {
            setDonorsLoading(true);
            const items = await projectService.getCharityDonors(projectId, { limit: 50 });
            setDonors(Array.isArray(items) ? items : (items?.items || []));
        } catch (e) {
            setDonors([]);
        } finally {
            setDonorsLoading(false);
        }
    };

    const handleSubmitForReview = async () => {
        try {
            setIsSubmittingForReview(true);
            await projectService.submitForReview(projectId);
            await loadProject();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to submit project for review');
        } finally {
            setIsSubmittingForReview(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mx-auto" />
                    <p className="text-[var(--text-muted)] font-medium">Loading project...</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md px-6">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-[var(--text-main)]">Project Not Found</h2>
                    <p className="text-[var(--text-muted)]">{error || "This project doesn't exist or has been removed."}</p>
                    <button
                        onClick={() => router.push('/explore')}
                        className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 transition-all font-semibold"
                    >
                        Browse Projects
                    </button>
                </div>
            </div>
        );
    }

    const raised = project.raisedAmount || project.progress?.raisedAmount || 0;
    const target = project.targetAmount || project.goalAmount || 1;
    const percentage = Math.min((raised / target) * 100, 100);
    const backerCount = project.backerCount || project.progress?.backerCount || 0;
    const currency = project.currency || 'UGX';
    const daysLeft = project.fundingEndDate
        ? Math.max(0, Math.ceil((new Date(project.fundingEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : project.deadline
            ? Math.max(0, Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : 30;

    const statusColorMap: Record<string, string> = {
        DRAFT: 'chip-neutral',
        PENDING_REVIEW: 'chip-warning',
        APPROVED: 'chip-info',
        FUNDING: 'chip-success',
        FUNDED: 'chip-info',
        ACTIVE: 'chip-success',
        COMPLETED: 'chip-info',
        REJECTED: 'chip-danger',
    };
    const statusColor = statusColorMap[project.status] || 'chip-neutral';
    const isOwner = isAuthenticated && (user?.id || user?._id) && (project.creatorId === (user?.id || user?._id));

    const charityProject = project.projectType === 'CHARITY' || project.type === 'CHARITY';
    const accentBg = charityProject ? 'bg-emerald-600' : 'bg-blue-600';
    const accentShadow = charityProject ? 'shadow-emerald-500/20' : 'shadow-blue-500/20';
    const accentGlow = charityProject ? 'bg-emerald-500/10' : 'bg-blue-500/10';

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)]">
            <Navbar />

            <main className="pt-20 pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">

                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] mb-8 font-medium transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>

                    {/* Status Notice */}
                    {(project.status === 'DRAFT' || project.status === 'PENDING_REVIEW' || project.status === 'REJECTED' || project.status === 'CHANGES_REQUESTED') && isOwner && (
                        <div className={`mb-8 p-4 rounded-2xl flex items-start gap-3 ${project.status === 'REJECTED'
                            ? 'bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30'
                            : project.status === 'CHANGES_REQUESTED'
                                ? 'bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/30'
                                : 'bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30'
                            }`}>
                            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${project.status === 'REJECTED' ? 'text-rose-700 dark:text-rose-300'
                                : project.status === 'CHANGES_REQUESTED' ? 'text-orange-600 dark:text-orange-300'
                                    : 'text-amber-700 dark:text-amber-300'
                                }`} />
                            <div className="flex-1 space-y-1">
                                <p className={`text-sm font-semibold ${project.status === 'REJECTED' ? 'text-rose-700 dark:text-rose-300'
                                    : project.status === 'CHANGES_REQUESTED' ? 'text-orange-700 dark:text-orange-300'
                                        : 'text-amber-800 dark:text-amber-200'
                                    }`}>
                                    {project.status === 'DRAFT'
                                        ? 'This campaign is in draft mode. Submit it for review to make it public.'
                                        : project.status === 'PENDING_REVIEW'
                                            ? 'Your campaign is under review. It will be visible once approved by our team.'
                                            : project.status === 'CHANGES_REQUESTED'
                                                ? 'Our review team has requested changes to your campaign before it can be approved.'
                                                : 'Your campaign was not approved at this time.'}
                                </p>
                                {project.decisionReason && (
                                    <p className="text-xs text-[var(--text-muted)] font-medium">
                                        <strong>Reason:</strong> {project.decisionReason}
                                    </p>
                                )}
                            </div>
                            {project.status === 'DRAFT' && isOwner && (
                                <button
                                    onClick={handleSubmitForReview}
                                    disabled={isSubmittingForReview}
                                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-60 flex-shrink-0"
                                >
                                    {isSubmittingForReview ? 'Submitting...' : 'Submit for Review'}
                                </button>
                            )}
                            {project.status === 'CHANGES_REQUESTED' && isOwner && (
                                <button
                                    onClick={handleSubmitForReview}
                                    disabled={isSubmittingForReview}
                                    className="px-4 py-2 rounded-xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-60 flex-shrink-0"
                                >
                                    {isSubmittingForReview ? 'Resubmitting...' : 'Resubmit'}
                                </button>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                        {/* ── Left Column ── */}
                        <div className="lg:col-span-2 space-y-10">

                            {/* Project Header */}
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`chip-base chip-compact px-4 py-2 shadow-lg ${charityProject ? 'chip-success' : 'chip-info'}`}>
                                        {charityProject ? 'Charity' : 'ROI'}
                                    </span>
                                    <span className={`chip-base chip-compact px-3 py-1.5 ${statusColor}`}>
                                        {project.status}
                                    </span>
                                    {project.category && (
                                        <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
                                            <Globe size={12} /> {project.category}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-4">
                                    {project.name}
                                </h1>
                                <p className="text-base sm:text-xl text-[var(--text-muted)] font-medium leading-relaxed">
                                    {project.summary}
                                </p>
                            </div>

                            {/* Media Carousel */}
                            <div className="relative rounded-3xl overflow-hidden bg-[var(--secondary)] aspect-video shadow-2xl">
                                {mediaItems.length > 0 ? (
                                    <>
                                        {currentMedia?.type === 'image' && (
                                            <Image
                                                src={currentMedia.url}
                                                alt={project.name}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                priority
                                            />
                                        )}
                                        {currentMedia?.type === 'video' && (
                                            <video src={currentMedia.url} controls className="w-full h-full object-cover" />
                                        )}
                                        {/* Navigation */}
                                        {mediaItems.length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => setMediaIndex((i) => (i - 1 + mediaItems.length) % mediaItems.length)}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                                                    aria-label="Previous"
                                                >
                                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => setMediaIndex((i) => (i + 1) % mediaItems.length)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                                                    aria-label="Next"
                                                >
                                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                                {/* Dots */}
                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                                    {mediaItems.map((_, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setMediaIndex(i)}
                                                            className={`w-2 h-2 rounded-full transition-all ${i === mediaIndex ? 'bg-white w-6' : 'bg-white/50'}`}
                                                            aria-label={`Go to media ${i + 1}`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-8xl font-black italic opacity-10 select-none">KEIBO</span>
                                    </div>
                                )}
                            </div>

                            {/* Tabs */}
                            <div>
                                <div className="flex items-center gap-1 border-b border-[var(--border)] mb-6 overflow-x-auto scrollbar-hide">
                                    {(['story', 'timeline', 'updates'] as const).map((tab) => {
                                        // Hide timeline and updates for Charity projects
                                        if (isCharity && (tab === 'timeline' || tab === 'updates')) return null;

                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-black uppercase tracking-widest border-b-2 transition-all -mb-px whitespace-nowrap flex-shrink-0 ${activeTab === tab
                                                    ? 'border-[var(--primary)] text-[var(--primary)]'
                                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                                    }`}
                                            >
                                                {tab}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Story Tab */}
                                {activeTab === 'story' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-8"
                                    >
                                        {project.story
                                            ? <ExpandableStory story={project.story} />
                                            : (
                                                <div className="bg-[var(--card)] p-8 rounded-3xl border border-[var(--border)] leading-loose text-lg space-y-4">
                                                    <p className="text-[var(--text-muted)]">No story provided yet.</p>
                                                </div>
                                            )}

                                        {/* Use of Funds */}
                                        {project.useOfFunds && project.useOfFunds.length > 0 && (
                                            <div className="bg-[var(--card)] p-8 rounded-3xl border border-[var(--border)]">
                                                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                                    <TrendingUp className="text-[var(--primary)]" size={20} /> Use of Funds
                                                </h3>
                                                <div className="space-y-4">
                                                    {project.useOfFunds.map((item: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
                                                            <div>
                                                                <p className="font-semibold">{item.item || item.category}</p>
                                                                <p className="text-sm text-[var(--text-muted)]">{item.percentage}% of total</p>
                                                            </div>
                                                            <span className="font-black text-[var(--primary)]">
                                                                {currency} {(item.amount || 0).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Website */}
                                        {project.website && (
                                            <a
                                                href={project.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-[var(--primary)] hover:underline font-semibold"
                                            >
                                                <ExternalLink size={16} /> Visit Website
                                            </a>
                                        )}
                                    </motion.div>
                                )}

                                {/* Timeline Tab */}
                                {activeTab === 'timeline' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6"
                                    >
                                        <h3 className="text-xl font-black flex items-center gap-2">
                                            <BarChart3 className="text-[var(--primary)]" size={20} /> Milestones
                                        </h3>
                                        {project.milestones && project.milestones.length > 0 ? (
                                            <div className="space-y-4">
                                                {project.milestones.map((m: any, i: number) => (
                                                    <div key={i} className="flex gap-6 items-start group">
                                                        <div className="flex flex-col items-center flex-shrink-0">
                                                            <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm shadow-lg">
                                                                {i + 1}
                                                            </div>
                                                            {i < project.milestones.length - 1 && (
                                                                <div className="w-0.5 h-12 bg-[var(--border)] mt-2" />
                                                            )}
                                                        </div>
                                                        <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] flex-grow group-hover:border-[var(--primary)]/40 transition-all">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="font-bold text-lg">{m.title}</h4>
                                                                {m.amount && (
                                                                    <span className="text-xs font-black text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded-lg">
                                                                        {currency} {m.amount.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-[var(--text-muted)]">{m.description}</p>
                                                            {(m.dueDate || m.date) && (
                                                                <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-1">
                                                                    <Calendar size={12} /> {m.dueDate || m.date}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-[var(--text-muted)]">
                                                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                                <p>No milestones defined yet.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Updates Tab */}
                                {activeTab === 'updates' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center py-16 text-[var(--text-muted)]"
                                    >
                                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                        <p>No updates posted yet.</p>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* ── Right Column: Sticky Sidebar ── */}
                        <div className="space-y-6">
                            <div className="sticky top-28 space-y-6">

                                {/* Funding Card */}
                                <div className="bg-[var(--card)] rounded-3xl p-8 border border-[var(--border)] shadow-2xl relative overflow-hidden">
                                    <div className={`absolute top-0 right-0 w-48 h-48 ${accentGlow} rounded-full blur-3xl -translate-y-24 translate-x-24 pointer-events-none`} />
                                    <div className="relative z-10 space-y-6">
                                        <div>
                                            <p className="text-4xl font-black tracking-tighter">
                                                {currency} {raised.toLocaleString()}
                                            </p>
                                            <p className="text-[var(--text-muted)] text-sm font-medium mt-1">
                                                raised of {currency} {target.toLocaleString()} goal
                                            </p>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="w-full bg-[var(--secondary)] h-3 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                                    className={`h-full ${accentBg} rounded-full`}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
                                                <span>{percentage.toFixed(1)}% funded</span>
                                                <span>{currency} {target.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-[var(--secondary)] p-4 rounded-2xl">
                                                <p className="text-2xl font-black">{backerCount}</p>
                                                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Backers</p>
                                            </div>
                                            <div className="bg-[var(--secondary)] p-4 rounded-2xl">
                                                <p className="text-2xl font-black">{daysLeft}</p>
                                                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Days Left</p>
                                            </div>
                                        </div>

                                        {/* CTA */}
                                        <div className="space-y-3">
                                            {!isCharity ? (
                                                <button
                                                    onClick={openInvestModal}
                                                    className={`w-full py-4 ${accentBg} text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl ${accentShadow} hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
                                                >
                                                    <TrendingUp size={16} />
                                                    Invest Now
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={openDonateModal}
                                                    className={`w-full py-4 ${accentBg} text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl ${accentShadow} hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
                                                >
                                                    <Heart size={16} />
                                                    Donate Now
                                                </button>
                                            )}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setBookmarked(!bookmarked)}
                                                    className={`flex-1 py-3 border border-[var(--border)] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2 ${bookmarked ? 'text-rose-400 border-rose-400/30' : ''}`}
                                                >
                                                    <Heart size={14} className={bookmarked ? 'fill-current' : ''} />
                                                    {bookmarked ? 'Saved' : 'Save'}
                                                </button>

                                                {/* Share button + dropdown */}
                                                <div className="flex-1 relative">
                                                    <button
                                                        onClick={() => setShowShareMenu(v => !v)}
                                                        className="w-full py-3 border border-[var(--border)] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Share2 size={14} /> Share
                                                    </button>

                                                    {showShareMenu && (
                                                        <>
                                                            {/* Backdrop */}
                                                            <div
                                                                className="fixed inset-0 z-40"
                                                                onClick={() => setShowShareMenu(false)}
                                                            />
                                                            {/* Dropdown */}
                                                            <div className="absolute bottom-full right-0 mb-2 w-56 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden z-50">
                                                                <p className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Share this project</p>

                                                                {/* X / Twitter */}
                                                                <button
                                                                    onClick={() => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(project?.name || 'Check out this project!')}&url=${encodeURIComponent(window.location.href)}`, '_blank'); setShowShareMenu(false); }}
                                                                    className="w-full px-4 py-3 flex items-center gap-3 text-sm font-semibold hover:bg-white/5 transition-colors text-left"
                                                                >
                                                                    <span className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-white text-xs font-black flex-shrink-0">𝕏</span>
                                                                    Post on X / Twitter
                                                                </button>

                                                                {/* WhatsApp */}
                                                                <button
                                                                    onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent((project?.name || 'Check this out') + ' ' + window.location.href)}`, '_blank'); setShowShareMenu(false); }}
                                                                    className="w-full px-4 py-3 flex items-center gap-3 text-sm font-semibold hover:bg-white/5 transition-colors text-left"
                                                                >
                                                                    <span className="w-7 h-7 rounded-lg bg-[#25D366] flex items-center justify-center flex-shrink-0">
                                                                        <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                                    </span>
                                                                    Share on WhatsApp
                                                                </button>

                                                                {/* Facebook */}
                                                                <button
                                                                    onClick={() => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank'); setShowShareMenu(false); }}
                                                                    className="w-full px-4 py-3 flex items-center gap-3 text-sm font-semibold hover:bg-white/5 transition-colors text-left"
                                                                >
                                                                    <span className="w-7 h-7 rounded-lg bg-[#1877F2] flex items-center justify-center text-white font-black text-sm flex-shrink-0">f</span>
                                                                    Share on Facebook
                                                                </button>

                                                                {/* Telegram */}
                                                                <button
                                                                    onClick={() => { window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(project?.name || '')}`, '_blank'); setShowShareMenu(false); }}
                                                                    className="w-full px-4 py-3 flex items-center gap-3 text-sm font-semibold hover:bg-white/5 transition-colors text-left"
                                                                >
                                                                    <span className="w-7 h-7 rounded-lg bg-[#229ED9] flex items-center justify-center flex-shrink-0">
                                                                        <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                                                                    </span>
                                                                    Share on Telegram
                                                                </button>

                                                                {/* Divider + Copy Link */}
                                                                <div className="border-t border-[var(--border)] mx-4" />
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard?.writeText(window.location.href);
                                                                        setCopySuccess(true);
                                                                        setTimeout(() => { setCopySuccess(false); setShowShareMenu(false); }, 2000);
                                                                    }}
                                                                    className="w-full px-4 py-3 flex items-center gap-3 text-sm font-semibold hover:bg-white/5 transition-colors text-left"
                                                                >
                                                                    {copySuccess
                                                                        ? <><CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" /> <span className="text-emerald-400">Copied!</span></>
                                                                        : <><Link2 size={16} className="flex-shrink-0" /> Copy Link</>
                                                                    }
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Creator */}
                                        <div className="pt-4 border-t border-[var(--border)] flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-black text-sm">
                                                {project.creator?.firstName?.[0]?.toUpperCase() || project.creator?.lastName?.[0]?.toUpperCase() || project.creator?.email?.[0]?.toUpperCase() || project.name?.[0]?.toUpperCase() || 'P'}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Creator</p>
                                                <p className="font-bold text-sm flex items-center gap-1">
                                                    {project.creator?.firstName && project.creator?.lastName
                                                        ? `${project.creator.firstName} ${project.creator.lastName}`
                                                        : project.creator?.firstName || project.creator?.lastName || project.creator?.email || 'Project Creator'}
                                                    <CheckCircle2 size={12} className="text-blue-400" />
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isCharity && (
                                    <div className="bg-[var(--card)] rounded-3xl p-6 border border-[var(--border)] shadow-xl">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-black text-xs uppercase tracking-widest text-[var(--text-muted)]">Donors</h4>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                                {donors.length}
                                            </span>
                                        </div>
                                        <div className="max-h-44 overflow-y-auto pr-2 space-y-2">
                                            {donorsLoading ? (
                                                <div className="text-sm text-[var(--text-muted)]">Loading...</div>
                                            ) : donors.length === 0 ? (
                                                <div className="text-sm text-[var(--text-muted)]">No donations yet.</div>
                                            ) : (
                                                donors.map((d) => (
                                                    <div key={d.id} className="flex items-center justify-between bg-[var(--secondary)] rounded-2xl px-4 py-3">
                                                        <div>
                                                            <p className="text-sm font-black">{d.donorName || 'Anonymous'}</p>
                                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Donation</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-black">{currency} {Number(d.amount || 0).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Trust Badges */}
                                <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <span>Donation Transparency Tracking</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <span>Milestone-Based Release</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <span>Community Accountability</span>
                                    </div>
                                </div>

                                {/* Disclosure */}
                                <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2 text-amber-400">
                                        <Flag size={16} />
                                        <h4 className="font-black text-xs uppercase tracking-widest">
                                            Donation Disclosure
                                        </h4>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                        Keibo facilitates fundraising but doesn't guarantee project delivery or outcomes. Donations are non-refundable unless explicitly stated. Contribute what you can afford.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <DPOPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                project={project}
            />

        </div>
    );
}
