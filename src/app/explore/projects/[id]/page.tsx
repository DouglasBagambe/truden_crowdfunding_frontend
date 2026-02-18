'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Heart,
    TrendingUp,
    Users,
    Clock,
    Share2,
    Flag,
    CheckCircle2,
    MessageCircle,
    BarChart3,
    Calendar,
    Globe,
    Twitter,
    Linkedin,
    Loader2,
    Wallet
} from 'lucide-react';
import { projectService } from '@/lib/project-service';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import InvestmentModal from '@/components/investment/InvestmentModal';

export default function ProjectDetailPage() {
    const { id } = useParams();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            loadProject();
        }
    }, [id]);

    const loadProject = async () => {
        try {
            const data = await projectService.getProject(id as string);
            setProject(data);
        } catch (error) {
            console.error('Error loading project:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Project not found</h1>
                    <button
                        onClick={() => window.location.href = '/explore'}
                        className="text-blue-600 hover:underline"
                    >
                        Back to Explore
                    </button>
                </div>
            </div>
        );
    }

    const raised = project.raisedAmount || 0;
    const target = project.targetAmount || project.goalAmount || 1;
    const percentage = Math.min((raised / target) * 100, 100);
    const daysLeft = Math.max(0, Math.ceil((new Date(project.fundingEndDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));

    return (
        <div className="bg-[var(--background)] min-h-screen text-[var(--text-main)]">
            <Navbar />

            <main className="pt-32 pb-24 container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column: Media & Content */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Project Header Visibility for Mobile */}
                        <div className="lg:hidden space-y-4 mb-8">
                            <div className="flex items-center gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${project.projectType === 'CHARITY' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                                    }`}>
                                    {project.projectType}
                                </span>
                                <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1">
                                    <Globe size={12} /> {project.category}
                                </span>
                            </div>
                            <h1 className="text-4xl font-black tracking-tight leading-tight">{project.name}</h1>
                        </div>

                        {/* Main Media */}
                        <div className="relative rounded-[3rem] overflow-hidden bg-[var(--secondary)] aspect-video shadow-2xl">
                            {project.imageUrl ? (
                                <img
                                    src={project.imageUrl}
                                    alt={project.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-9xl italic font-black opacity-10 select-none">
                                    TRUDEN
                                </div>
                            )}
                        </div>

                        {/* Navigation Tabs (Style only) */}
                        <div className="flex items-center gap-8 border-b border-[var(--border)] pb-2 overflow-x-auto no-scrollbar">
                            <button className="text-sm font-black uppercase tracking-widest border-b-4 border-[var(--primary)] pb-4 text-[var(--primary)]">Story</button>
                            <button className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] pb-4 transition-colors">Updates</button>
                            <button className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] pb-4 transition-colors">Campaign</button>
                            <button className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] pb-4 transition-colors">Investors</button>
                        </div>

                        {/* Story Content */}
                        <div className="prose prose-invert max-w-none">
                            <p className="text-xl text-[var(--text-muted)] font-medium leading-relaxed italic mb-8">
                                {project.summary}
                            </p>
                            <div className="bg-[var(--card)] p-10 rounded-[2.5rem] border border-[var(--border)] leading-loose text-lg text-[var(--text-main)] space-y-6">
                                {project.story && project.story.split('\n').map((para: string, i: number) => (
                                    <p key={i}>{para}</p>
                                ))}
                            </div>
                        </div>

                        {/* Milestones */}
                        {project.milestones && project.milestones.length > 0 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black flex items-center gap-3">
                                    <BarChart3 className="text-[var(--primary)]" /> Roadmap & Milestones
                                </h3>
                                <div className="space-y-4">
                                    {project.milestones.map((milestone: any, i: number) => (
                                        <div key={i} className="flex gap-6 items-start group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/20">{i + 1}</div>
                                                {i < project.milestones.length - 1 && <div className="w-0.5 h-full bg-[var(--border)] mt-2" />}
                                            </div>
                                            <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] flex-grow group-hover:border-[var(--primary)]/50 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-lg">{milestone.title}</h4>
                                                    <span className="text-xs font-black text-[var(--primary)]">{project.currency} {milestone.amount.toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-[var(--text-muted)] font-medium">{milestone.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sidebar Sticky */}
                    <div className="space-y-8">
                        <div className="sticky top-32 space-y-8">

                            {/* Backer Stats Card */}
                            <div className="bg-[var(--card)] rounded-[3rem] p-10 border border-[var(--border)] shadow-2xl relative overflow-hidden group">
                                <div className="relative z-10 space-y-8">
                                    <div className="space-y-2">
                                        <h2 className="text-5xl font-black tracking-tighter">
                                            {project.currency} {raised.toLocaleString()}
                                        </h2>
                                        <p className="text-[var(--text-muted)] text-sm font-medium">
                                            raised of {project.currency} {target.toLocaleString()} goal
                                        </p>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-4">
                                        <div className="w-full bg-[var(--secondary)] h-4 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className="h-full bg-[var(--primary)] rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
                                            <span>{percentage.toFixed(1)}% funded</span>
                                            <span>{project.currency} {target.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Quick Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[var(--secondary)] p-4 rounded-2xl flex items-center gap-3">
                                            <Users className="w-5 h-5 text-[var(--primary)]" />
                                            <div>
                                                <p className="text-xl font-black leading-none">124</p>
                                                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Backers</p>
                                            </div>
                                        </div>
                                        <div className="bg-[var(--secondary)] p-4 rounded-2xl flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-amber-500" />
                                            <div>
                                                <p className="text-xl font-black leading-none">{daysLeft}</p>
                                                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Days Left</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CTA Buttons */}
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => setIsInvestmentModalOpen(true)}
                                            className="w-full py-6 bg-[var(--primary)] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                        >
                                            <Wallet size={18} /> Invest in Project
                                        </button>
                                        <div className="flex gap-4">
                                            <button className="flex-1 py-4 bg-white/5 border border-[var(--border)] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                                <Share2 size={14} /> Share
                                            </button>
                                            <button className="flex-1 py-4 bg-white/5 border border-[var(--border)] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                                <Heart size={14} /> Bookmark
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-[var(--border)] flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xl italic shadow-lg">T</div>
                                        <div>
                                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-0.5">Project Creator</p>
                                            <p className="font-bold flex items-center gap-1.5">Truden Lead <CheckCircle2 size={14} className="text-blue-500" /></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Glass decoration */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />
                            </div>

                            {/* Safety/Risk Notice */}
                            <div className="p-8 bg-amber-500/5 border border-amber-500/20 rounded-[2.5rem] space-y-4">
                                <div className="flex items-center gap-3 text-amber-500">
                                    <Flag size={20} />
                                    <h4 className="font-black text-xs uppercase tracking-widest">Investment Disclosure</h4>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">
                                    Truden facilitates crowdfunding but doesn't guarantee project delivery. Investments carry risks. Only contribute what you can afford to lose.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* MODAL */}
            <InvestmentModal
                isOpen={isInvestmentModalOpen}
                onClose={() => setIsInvestmentModalOpen(false)}
                project={{
                    _id: project._id,
                    name: project.name,
                    targetAmount: target,
                    currency: project.currency || 'UGX'
                }}
                userEmail="investor@example.com" // This should come from auth context
            />

            <Footer />
        </div>
    );
}
