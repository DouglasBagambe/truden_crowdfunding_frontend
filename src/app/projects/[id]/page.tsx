'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Calendar, Users, Clock, CheckCircle, AlertCircle,
    Heart, Share2, Bookmark, Globe, TrendingUp, BarChart3,
    Flag, Wallet, Loader2, CheckCircle2, ExternalLink, X
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { projectService } from '@/lib/project-service';
import { useAuth } from '@/hooks/useAuth';

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const { isAuthenticated, user } = useAuth();

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'story' | 'timeline' | 'updates'>('story');
    const [bookmarked, setBookmarked] = useState(false);
    const [isSubmittingForReview, setIsSubmittingForReview] = useState(false);
    const [isDonateOpen, setIsDonateOpen] = useState(false);
    const [donationAmount, setDonationAmount] = useState('');
    const [donorName, setDonorName] = useState('');
    const [isDonating, setIsDonating] = useState(false);
    const [donationError, setDonationError] = useState('');
    const [donors, setDonors] = useState<Array<{ id: string; donorName: string; amount: number; createdAt?: string | null }>>([]);
    const [donorsLoading, setDonorsLoading] = useState(false);

    const projectType = project?.projectType || project?.type;
    const isCharity = projectType === 'CHARITY';
    const isRoi = projectType === 'ROI';

    const [mediaIndex, setMediaIndex] = useState(0);
    const mediaItems = project ? [
        ...(project.imageUrl ? [{ type: 'image', url: project.imageUrl }] : []),
        ...(project.galleryImages || []).map(url => ({ type: 'image', url })),
        ...(project.videoUrls || []).map(url => ({ type: 'video', url })),
    ] : [];
    const currentMedia = mediaItems[mediaIndex];

    const getPrefillDonorName = () => {
        const firstName = (user as any)?.firstName;
        const lastName = (user as any)?.lastName;
        const combined = `${typeof firstName === 'string' ? firstName : ''} ${typeof lastName === 'string' ? lastName : ''}`.trim();
        const fallback = (user as any)?.name || (user as any)?.fullName;
        const email = (user as any)?.email;
        const profileName = (combined || fallback || email || '').toString().trim();
        return profileName;
    };

    const openDonateModal = () => {
        const prefill = getPrefillDonorName();
        console.log('[DONATE_DEBUG] user:', user);
        console.log('[DONATE_DEBUG] prefill name:', prefill);
        console.log('[DONATE_DEBUG] current donorName:', donorName);
        if (!donorName.trim() && prefill) {
            setDonorName(prefill);
        }
        setIsDonateOpen(true);
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
        setMediaIndex(0);
    }, [project]);

    const loadProject = async () => {
        try {
            setLoading(true);
            const data = await projectService.getProject(projectId);
            // Handle backend response structure { project, milestones }
            if (data && data.project) {
                setProject({ ...data.project, milestones: data.milestones || data.project.milestones || [] });
                console.log('[PROJECT_DEBUG] project.creator:', data.project.creator);
            } else {
                setProject(data);
            }
        } catch (err: any) {
            console.error('Error loading project:', err);
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

    const handleDonate = async () => {
        try {
            setDonationError('');
            const amountNumber = Number(donationAmount);
            if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
                setDonationError('Enter a valid amount');
                return;
            }
            setIsDonating(true);
            await projectService.donateToCharity(projectId, {
                amount: amountNumber,
                donorName: donorName.trim() ? donorName.trim() : 'Anonymous',
            });
            setIsDonateOpen(false);
            setDonationAmount('');
            setDonorName('');
            await loadProject();
            await loadDonors();
        } catch (err: any) {
            console.error('Donation error:', err);
            setDonationError(err?.response?.data?.message || 'Donation failed');
        } finally {
            setIsDonating(false);
        }
    };

    const handleSubmitForReview = async () => {
        try {
            setIsSubmittingForReview(true);
            await projectService.submitForReview(projectId);
            await loadProject();
        } catch (err: any) {
            console.error('Error submitting project for review:', err);
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
        DRAFT: 'bg-gray-500/10 text-gray-400',
        PENDING_REVIEW: 'bg-amber-500/10 text-amber-400',
        APPROVED: 'bg-blue-500/10 text-blue-400',
        FUNDING: 'bg-emerald-500/10 text-emerald-400',
        FUNDED: 'bg-blue-500/10 text-blue-400',
        ACTIVE: 'bg-emerald-500/10 text-emerald-400',
        COMPLETED: 'bg-blue-500/10 text-blue-400',
        REJECTED: 'bg-red-500/10 text-red-400',
    };
    const statusColor = statusColorMap[project.status] || 'bg-gray-500/10 text-gray-400';
    const isOwner = isAuthenticated && (user?.id || user?._id) && (project.creatorId === (user?.id || user?._id));

    const isCharityProject = project.projectType === 'CHARITY' || project.type === 'CHARITY';
    const accentText = isCharityProject ? 'text-emerald-400' : 'text-blue-400';
    const accentBorderText = isCharityProject ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400';
    const accentBg = isCharityProject ? 'bg-emerald-600' : 'bg-blue-600';
    const accentShadow = isCharityProject ? 'shadow-emerald-500/20' : 'shadow-blue-500/20';
    const accentGlow = isCharityProject ? 'bg-emerald-500/10' : 'bg-blue-500/10';

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)]">
            <Navbar />

            <main className="pt-28 pb-24">
                <div className="max-w-7xl mx-auto px-6">

                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] mb-8 font-medium transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>

                    {/* Draft Notice */}
                    {(project.status === 'DRAFT' || project.status === 'PENDING_REVIEW') && (
                        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm text-amber-300 font-medium">
                                    {project.status === 'DRAFT'
                                        ? 'This project is in draft mode. Submit it for review to make it public.'
                                        : 'This project is under review and will be publicly visible once approved.'}
                                </p>
                            </div>
                            {project.status === 'DRAFT' && isOwner && (
                                <button
                                    onClick={handleSubmitForReview}
                                    disabled={isSubmittingForReview}
                                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-60"
                                >
                                    {isSubmittingForReview ? 'Submitting...' : 'Submit for Review'}
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
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${accentBorderText}`}>
                                        {isCharityProject ? 'Charity' : 'ROI Project'}
                                    </span>
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${statusColor}`}>
                                        {project.status}
                                    </span>
                                    {project.category && (
                                        <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
                                            <Globe size={12} /> {project.category}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                                    {project.name}
                                </h1>
                                <p className="text-xl text-[var(--text-muted)] font-medium leading-relaxed">
                                    {project.summary}
                                </p>
                            </div>

                            {/* Media Carousel */}
                            <div className="relative rounded-3xl overflow-hidden bg-[var(--secondary)] aspect-video shadow-2xl">
                                {mediaItems.length > 0 ? (
                                    <>
                                        {currentMedia?.type === 'image' && (
                                            <img src={currentMedia.url} alt={project.name} className="w-full h-full object-cover" />
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
                                        <span className="text-8xl font-black italic opacity-10 select-none">TRUDEN</span>
                                    </div>
                                )}
                            </div>

                            {/* Tabs */}
                            <div>
                                <div className="flex items-center gap-1 border-b border-[var(--border)] mb-8">
                                    {(['story', 'timeline', 'updates'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 transition-all -mb-px ${activeTab === tab
                                                ? 'border-[var(--primary)] text-[var(--primary)]'
                                                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* Story Tab */}
                                {activeTab === 'story' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-8"
                                    >
                                        <div className="bg-[var(--card)] p-8 rounded-3xl border border-[var(--border)] leading-loose text-lg space-y-4">
                                            {project.story
                                                ? project.story.split('\n').map((para: string, i: number) => (
                                                    <p key={i} className="text-[var(--text-main)] break-words whitespace-pre-wrap">{para}</p>
                                                ))
                                                : <p className="text-[var(--text-muted)]">No story provided yet.</p>
                                            }
                                        </div>

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
                                            {isCharity ? (
                                                <button
                                                    onClick={openDonateModal}
                                                    className={`w-full py-4 ${accentBg} text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl ${accentShadow} hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
                                                >
                                                    <Wallet size={16} />
                                                    Donate Now
                                                </button>
                                            ) : (
                                                <button
                                                    disabled={!isAuthenticated}
                                                    className={`w-full py-4 ${accentBg} text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl ${accentShadow} hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                                                >
                                                    <Wallet size={16} />
                                                    {isAuthenticated ? 'Invest in Project' : 'Sign In to Invest'}
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
                                                <button
                                                    onClick={() => navigator.clipboard?.writeText(window.location.href)}
                                                    className="flex-1 py-3 border border-[var(--border)] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Share2 size={14} /> Share
                                                </button>
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
                                <div className={`bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] space-y-3 ${isCharity ? 'hidden' : ''}`}>
                                    {isRoi && (
                                        <>
                                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                <span>Smart Contract Escrow Protection</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                <span>Milestone-Based Fund Release</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                <span>NFT Investment Certificate</span>
                                            </div>
                                        </>
                                    )}
                                    {isCharity && (
                                        <>
                                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                <span>Donation Transparency Tracking</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                <span>Milestone-Based Release (if applicable)</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                <span>Community Accountability</span>
                                            </div>
                                        </>
                                    )}
                                    {!isCharity && !isRoi && (
                                        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                            <span>Protocol Safeguards Enabled</span>
                                        </div>
                                    )}
                                </div>

                                {/* Disclosure */}
                                <div className={`p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2 ${isCharity ? 'hidden' : ''}`}>
                                    <div className="flex items-center gap-2 text-amber-400">
                                        <Flag size={16} />
                                        <h4 className="font-black text-xs uppercase tracking-widest">
                                            {isCharity ? 'Donation Disclosure' : 'Investment Disclosure'}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                        {isCharity
                                            ? "Truden facilitates fundraising but doesn't guarantee project delivery or outcomes. Donations are non-refundable unless explicitly stated. Contribute what you can afford."
                                            : "Truden facilitates crowdfunding but doesn't guarantee project delivery. Investments carry risks. Only contribute what you can afford to lose."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            {isCharity && isDonateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6">
                    <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black">Donate to this project</h3>
                            </div>
                            <button
                                onClick={() => { setIsDonateOpen(false); setDonationError(''); }}
                                className="p-2 rounded-xl hover:bg-white/5 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Amount ({currency})</label>
                                <input
                                    value={donationAmount}
                                    onChange={(e) => setDonationAmount(e.target.value)}
                                    type="number"
                                    min="1"
                                    placeholder="Enter amount"
                                    className="input_field"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Name (optional)</label>
                                <input
                                    value={donorName}
                                    onChange={(e) => setDonorName(e.target.value)}
                                    type="text"
                                    placeholder="Anonymous"
                                    className="input_field"
                                />
                            </div>

                            {donationError && (
                                <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm font-medium">
                                    {donationError}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setIsDonateOpen(false); setDonationError(''); }}
                                    className="flex-1 py-3 border border-[var(--border)] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
                                    disabled={isDonating}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDonate}
                                    className="flex-1 py-3 bg-[var(--primary)] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-60"
                                    disabled={isDonating}
                                >
                                    {isDonating ? 'Processing...' : 'Donate'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
