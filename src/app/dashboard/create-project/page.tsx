'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    ArrowRight,
    ArrowLeft,
    Upload,
    Trash2,
    Globe,
    Twitter,
    Linkedin,
    CheckCircle2,
    AlertCircle,
    FileText,
    Image as ImageIcon,
    DollarSign,
    Info,
    MapPin,
    Users,
    CreditCard,
    Calendar,
    TrendingUp,
    Target,
    Star,
    PlaySquare
} from 'lucide-react';
import { projectService, ProjectType, type CreateProjectParams } from '@/lib/project-service';
import { useAuth } from '@/hooks/useAuth';

const CHARITY_CATEGORIES = [
    { label: 'School', value: 'school' },
    { label: 'Church', value: 'church' },
    { label: 'Community Group', value: 'community_group' },
    { label: 'NGO', value: 'ngo' },
    { label: 'Individual', value: 'individual' },
    { label: 'Family', value: 'family' }
];

const ROI_INDUSTRIES = [
    { label: 'Technology', value: 'technology' },
    { label: 'Health', value: 'health' },
    { label: 'Education', value: 'education' },
    { label: 'Agriculture', value: 'agriculture' },
    { label: 'Energy', value: 'energy' },
    { label: 'Financial Services', value: 'financial_services' },
    { label: 'Manufacturing', value: 'manufacturing' },
    { label: 'Real Estate', value: 'real_estate' },
    { label: 'Transport', value: 'transport' },
    { label: 'Other', value: 'other' }
];

const CHARITY_SUBCATEGORIES = [
    { label: 'Health', value: 'health' },
    { label: 'Education', value: 'education' },
    { label: 'Evangelical Mission', value: 'evangelical_mission' },
    { label: 'Outreach', value: 'outreach' },
    { label: 'Relief', value: 'relief' },
    { label: 'Infrastructure', value: 'infrastructure' }
];

const isProbablyUrl = (value: unknown): value is string => {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    try {
        // Accept only absolute URLs for backend IsUrl validation
        const u = new URL(trimmed);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
};

export default function CreateProjectPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAuthLoading) return;
        if (!isAuthenticated) {
            router.push('/login?next=/create-project');
        }
    }, [isAuthenticated, isAuthLoading, router]);

    // Form State
    const [formData, setFormData] = useState<CreateProjectParams>({
        name: '',
        type: ProjectType.CHARITY,
        category: 'ngo',
        subcategory: 'education',
        industry: 'technology',
        summary: '',
        story: '',
        country: 'Uganda',
        location: '',
        beneficiary: '',
        paymentMethod: 'FLUTTERWAVE_ESCROW',
        targetAmount: 0,
        currency: 'UGX',
        fundingEndDate: '',
        website: '',
        videoUrls: [],
        galleryImages: [],
        imageUrl: '',
        socialLinks: [],
        milestones: [],
        useOfFunds: []
    });

    const nextStep = () => {
        // Simple validation
        if (step === 1) {
            if (!formData.name || formData.name.length < 4) {
                setError('Project name must be at least 4 characters');
                return;
            }
            if (!formData.summary || formData.summary.length < 4) {
                setError('Summary must be at least 4 characters');
                return;
            }
            if (!formData.country || formData.country.length < 2) {
                setError('Country is required');
                return;
            }
            if (!formData.beneficiary || formData.beneficiary.length < 2) {
                setError('Beneficiary is required');
                return;
            }
            if (formData.location && formData.location.length < 2) {
                setError('Location must be at least 2 characters');
                return;
            }
        }
        if (step === 2) {
            if (!formData.story || formData.story.length < 10) {
                setError('Story must be at least 10 characters');
                return;
            }
        }

        setError('');
        setStep(s => Math.min(s + 1, 5));
    };

    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleCreate = async () => {
        setLoading(true);
        setError('');
        try {
            // Cleanup data before sending
            const payload: any = { ...formData };
            if (payload.type === ProjectType.CHARITY) {
                delete payload.industry;
            } else {
                delete payload.category;
                delete payload.subcategory;
            }

            // Remove optional empty strings to avoid backend validation errors (Length, IsUrl, etc)
            if (!payload.website) delete payload.website;
            if (!payload.location) delete payload.location;
            if (!payload.challenges) delete payload.challenges;
            if (!payload.risks) delete payload.risks;
            if (!payload.imageUrl) delete payload.imageUrl;
            if (payload.socialLinks) {
                payload.socialLinks = payload.socialLinks.filter((l: any) => l.url && l.url.trim().length > 0);
                if (payload.socialLinks.length === 0) delete payload.socialLinks;
            }
            if (payload.galleryImages) {
                payload.galleryImages = payload.galleryImages.filter((u: any) => isProbablyUrl(u));
                if (payload.galleryImages.length === 0) delete payload.galleryImages;
            }
            if (payload.videoUrls && payload.videoUrls.length === 0) delete payload.videoUrls;

            console.log('[CREATE_PROJECT_DEBUG] payload.imageUrl:', payload.imageUrl);
            console.log('[CREATE_PROJECT_DEBUG] payload.galleryImages:', payload.galleryImages);
            console.log('[CREATE_PROJECT_DEBUG] full payload:', payload);

            const result = await projectService.createProject(payload);
            const projectId = result.project?._id || result.project?.id || result._id || result.id;
            if (!projectId) {
                throw new Error('Project created but no ID returned from server');
            }
            router.push(`/projects/${projectId}`);
        } catch (err: any) {
            console.error('Create error:', err);
            const msg = Array.isArray(err.response?.data?.message)
                ? err.response.data.message.join(', ')
                : err.response?.data?.message || 'Failed to create project. Please check all fields.';
            setError(msg);
            setLoading(false);
        }
    };

    const addMilestone = () => {
        setFormData({
            ...formData,
            milestones: [...(formData.milestones || []), { title: '', description: '', dueDate: '', payoutPercentage: 0 }]
        });
    };

    const updateMilestone = (index: number, field: string, value: any) => {
        const newMilestones = [...(formData.milestones || [])];
        newMilestones[index] = { ...newMilestones[index], [field]: value };
        setFormData({ ...formData, milestones: newMilestones });
    };

    const removeMilestone = (index: number) => {
        setFormData({
            ...formData,
            milestones: (formData.milestones || []).filter((_, i) => i !== index)
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'gallery' | 'video' | 'cover') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setLoading(true);
        setError('');
        try {
            const urls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                try {
                    const res = await projectService.uploadMedia(files[i]);
                    console.log('[CREATE_PROJECT_DEBUG] uploadMedia response:', res);
                    // Assuming API base handle by client, res.url should be valid
                    const candidateUrl = res?.url;
                    if (isProbablyUrl(candidateUrl)) {
                        urls.push(candidateUrl);
                    } else {
                        console.warn('[CREATE_PROJECT_DEBUG] uploadMedia returned invalid url:', candidateUrl);
                    }
                } catch (err: any) {
                    console.error('File upload failed:', err);
                    const msg = err.response?.data?.message || err.message || files[i].name;
                    setError(`Failed to upload: ${msg}`);
                }
            }

            // Ensure we never store invalid URLs (backend validates IsUrl)
            const safeUrls = urls.filter((u) => isProbablyUrl(u));
            console.log('[CREATE_PROJECT_DEBUG] safeUrls:', safeUrls);

            if (type === 'cover') {
                if (safeUrls.length > 0) {
                    setFormData(prev => ({ ...prev, imageUrl: safeUrls[0] }));
                }
            } else if (type === 'gallery') {
                setFormData(prev => ({
                    ...prev,
                    galleryImages: [...(prev.galleryImages || []), ...safeUrls],
                    // If no cover image yet, set the first gallery image as cover
                    imageUrl: prev.imageUrl || safeUrls[0] || ''
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    videoUrls: [...(prev.videoUrls || []), ...safeUrls]
                }));
            }
        } catch (err) {
            setError('Failed to process upload');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
            {/* Step Indicator */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 py-4 shadow-sm">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <div key={s} className="flex items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${s === step
                                        ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100'
                                        : s < step
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-200 text-gray-400'
                                        }`}
                                >
                                    {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
                                </div>
                                {s < 5 && (
                                    <div className={`h-1 w-12 md:w-24 mx-2 rounded-full ${s < step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-3 text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">
                        <span>Basic Info</span>
                        <span>Story</span>
                        <span>Funding</span>
                        <span>Media</span>
                        <span>Review</span>
                    </div>
                </div>
            </div>

            <div className="flex-grow max-w-4xl mx-auto w-full px-4 py-8">
                <AnimatePresence mode="wait">
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white rounded-3xl shadow-xl p-8 md:p-12 space-y-8 border border-gray-100"
                        >
                            <div>
                                <h2 className="text-4xl font-black text-gray-900 leading-tight">Let's start with the basics</h2>
                                <p className="text-gray-500 mt-2 font-medium">Define your project type and core identity.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button
                                    onClick={() => setFormData({ ...formData, type: ProjectType.CHARITY })}
                                    className={`p-8 border-2 rounded-2xl text-left transition-all relative overflow-hidden group ${formData.type === ProjectType.CHARITY
                                        ? 'border-blue-600 bg-blue-50/50 shadow-md'
                                        : 'border-gray-100 hover:border-gray-200 bg-white'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${formData.type === ProjectType.CHARITY ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <Users size={24} />
                                    </div>
                                    <p className="text-2xl font-black text-gray-900 mb-2">Charity</p>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">Donation-based funding for social causes and community impact.</p>
                                    {formData.type === ProjectType.CHARITY && (
                                        <div className="absolute top-4 right-4 text-blue-600">
                                            <CheckCircle2 size={24} />
                                        </div>
                                    )}
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, type: ProjectType.ROI })}
                                    className={`p-8 border-2 rounded-2xl text-left transition-all relative overflow-hidden group ${formData.type === ProjectType.ROI
                                        ? 'border-emerald-600 bg-emerald-50/50 shadow-md'
                                        : 'border-gray-100 hover:border-gray-200 bg-white'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${formData.type === ProjectType.ROI ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <TrendingUpWrapper />
                                    </div>
                                    <p className="text-2xl font-black text-gray-900 mb-2">ROI / Equity</p>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">Investment-based funding where backers expect financial returns.</p>
                                    {formData.type === ProjectType.ROI && (
                                        <div className="absolute top-4 right-4 text-emerald-600">
                                            <CheckCircle2 size={24} />
                                        </div>
                                    )}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Project Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Solar Energy for Rural Schools"
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-600 transition-all outline-none font-bold text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                        {formData.type === ProjectType.CHARITY ? 'Category' : 'Industry'}
                                    </label>
                                    <select
                                        value={formData.type === ProjectType.CHARITY ? formData.category : formData.industry}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (formData.type === ProjectType.CHARITY) {
                                                setFormData({ ...formData, category: val });
                                            } else {
                                                setFormData({ ...formData, industry: val });
                                            }
                                        }}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-100"
                                    >
                                        {formData.type === ProjectType.CHARITY ? (
                                            CHARITY_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)
                                        ) : (
                                            ROI_INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)
                                        )}
                                    </select>
                                </div>
                                {formData.type === ProjectType.CHARITY && (
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Subcategory</label>
                                        <select
                                            value={formData.subcategory}
                                            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-100"
                                        >
                                            {CHARITY_SUBCATEGORIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Country of Operation</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-100"
                                            placeholder="e.g. Uganda"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">City / Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-100"
                                            placeholder="e.g. Kampala"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Direct Beneficiary</label>
                                    <input
                                        type="text"
                                        value={formData.beneficiary}
                                        onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-100"
                                        placeholder="e.g. St. Jude Primary School"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Short Summary</label>
                                    <textarea
                                        maxLength={500}
                                        value={formData.summary}
                                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                        placeholder="Briefly describe the impact of your project in 2 sentences..."
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 h-28 font-medium text-gray-700 leading-relaxed"
                                    />
                                    <p className="text-right text-[10px] font-black text-gray-400 mt-2 px-1">{formData.summary.length}/500</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Story */}
                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white rounded-3xl shadow-xl p-8 md:p-12 space-y-8"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-4xl font-black text-gray-900 leading-tight">Tell your story</h2>
                                    <p className="text-gray-500 mt-2 font-medium">Be authentic, transparent, and compelling.</p>
                                </div>
                                <div className="hidden md:flex flex-col items-center bg-blue-50 p-4 rounded-2xl border border-blue-100 max-w-[200px]">
                                    <Info className="w-8 h-8 text-blue-600 mb-2" />
                                    <p className="text-[10px] font-bold text-blue-800 text-center leading-relaxed">Longer stories build more trust with backers.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Project Story (Minimum 10 chars)</label>
                                    <textarea
                                        value={formData.story}
                                        onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                                        placeholder="Tell the world why you started this, the challenges you face, and the exact difference you will make. Use paragraphs for readability..."
                                        className="w-full px-6 py-6 bg-gray-50 border border-gray-200 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all h-[400px] font-medium text-gray-800 leading-relaxed text-lg"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Project Website (Optional)</label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="url"
                                                value={formData.website}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none"
                                                placeholder="https://truden.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Payment Method</label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <select
                                                value={formData.paymentMethod}
                                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                                className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none"
                                            >
                                                <option value="FLUTTERWAVE_ESCROW">Flutterwave Escrow</option>
                                                <option value="BANK_TRANSFER">Bank Transfer (Manual)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Funding */}
                    {step === 3 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white rounded-3xl shadow-xl p-8 md:p-12 space-y-10"
                        >
                            <div>
                                <h2 className="text-4xl font-black text-gray-900">Funding Goals</h2>
                                <p className="text-gray-500 mt-2 font-medium">Be precise about the capital you need.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 flex flex-col justify-center">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Total Target Amount</label>
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl font-black text-gray-400">UGX</span>
                                        <input
                                            type="number"
                                            value={formData.targetAmount || ''}
                                            onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                                            placeholder="1,000,000"
                                            className="bg-transparent border-none text-5xl font-black text-blue-600 w-full focus:outline-none placeholder:text-gray-200"
                                        />
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Campaign End Date</label>
                                    <div className="relative">
                                        <CalendarWrapper />
                                        <input
                                            type="date"
                                            value={formData.fundingEndDate}
                                            onChange={(e) => setFormData({ ...formData, fundingEndDate: e.target.value })}
                                            className="w-full bg-transparent border-none text-2xl font-black text-gray-900 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-black text-xl text-gray-900 tracking-tight">Project Milestones</h3>
                                    <button
                                        onClick={addMilestone}
                                        className="flex items-center gap-2 bg-blue-100 text-blue-600 px-5 py-2.5 rounded-xl font-black text-xs hover:bg-blue-600 hover:text-white transition-all"
                                    >
                                        <Plus className="w-4 h-4" /> ADD MILESTONE
                                    </button>
                                </div>

                                {(!formData.milestones || formData.milestones.length === 0) && (
                                    <div className="text-center py-20 border-4 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center grayscale opacity-50">
                                        <Target className="w-16 h-16 text-gray-300 mb-4" />
                                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">At least one milestone required</p>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {formData.milestones?.map((milestone, idx) => (
                                        <div key={idx} className="p-8 bg-white rounded-3xl border border-gray-200 relative group transition-all hover:border-blue-400 hover:shadow-2xl">
                                            <button
                                                onClick={() => removeMilestone(idx)}
                                                className="absolute right-6 top-6 w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="md:col-span-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Milestone {idx + 1} Title</label>
                                                    <input
                                                        type="text"
                                                        value={milestone.title}
                                                        onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                                                        placeholder="e.g. Groundbreaking & Foundations"
                                                        className="w-full bg-transparent border-b-4 border-gray-100 py-2 text-2xl font-black text-gray-900 focus:border-blue-500 outline-none transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Target Date</label>
                                                    <input
                                                        type="date"
                                                        value={milestone.dueDate}
                                                        onChange={(e) => updateMilestone(idx, 'dueDate', e.target.value)}
                                                        className="w-full bg-gray-50 px-4 py-3 rounded-xl font-bold text-gray-900 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Budget Allocation (%)</label>
                                                    <input
                                                        type="number"
                                                        value={milestone.payoutPercentage || ''}
                                                        onChange={(e) => updateMilestone(idx, 'payoutPercentage', Number(e.target.value))}
                                                        placeholder="e.g. 25"
                                                        className="w-full bg-gray-50 px-4 py-3 rounded-xl font-bold text-gray-900 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Media */}
                    {step === 4 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white rounded-3xl shadow-xl p-8 md:p-12 space-y-12"
                        >
                            <h2 className="text-4xl font-black text-gray-900 leading-tight">Media Presence</h2>

                            <div className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'cover')}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            disabled={loading}
                                        />
                                        <div className={`flex flex-col items-center justify-center border-4 border-dashed p-8 rounded-[2.5rem] transition-all h-full ${formData.imageUrl ? 'bg-blue-50 border-blue-400' : 'bg-gray-50/50 border-gray-100 hover:bg-blue-50 hover:border-blue-200'
                                            }`}>
                                            {formData.imageUrl ? (
                                                <div className="relative w-full h-full min-h-[140px]">
                                                    <img src={formData.imageUrl} className="w-full h-full object-cover rounded-2xl shadow-lg" />
                                                    <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Change Cover</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500">
                                                        <Star className="w-8 h-8" />
                                                    </div>
                                                    <p className="font-black text-gray-900 text-lg">Featured Cover</p>
                                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest text-center">Main project image</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'gallery')}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            disabled={loading}
                                        />
                                        <div className="flex flex-col items-center justify-center border-4 border-dashed border-gray-100 p-8 rounded-[2.5rem] bg-gray-50/50 group-hover:bg-blue-50 group-hover:border-blue-200 transition-all h-full">
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                                <Upload className="w-8 h-8" />
                                            </div>
                                            <p className="font-black text-gray-900 text-lg">Photo Gallery</p>
                                            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest text-center">Add high-quality photos</p>
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={(e) => handleFileUpload(e, 'video')}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            disabled={loading}
                                        />
                                        <div className="flex flex-col items-center justify-center border-4 border-dashed border-gray-100 p-8 rounded-[2.5rem] bg-gray-50/50 group-hover:bg-amber-50 group-hover:border-amber-200 transition-all h-full">
                                            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                                                <PlaySquare className="w-8 h-8" />
                                            </div>
                                            <p className="font-black text-gray-900 text-lg">Video Pitch</p>
                                            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest text-center">Optional 1-2min video</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview Section */}
                                {(formData.galleryImages?.length || 0) > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Uploaded Images</h3>
                                        <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                                            {formData.galleryImages?.map((url, i) => (
                                                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-md">
                                                    <img src={url} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => setFormData(p => ({ ...p, galleryImages: p.galleryImages?.filter((_, idx) => idx !== i) }))}
                                                        className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-6 pt-6 border-t border-gray-100">
                                    <h3 className="font-black text-xl text-gray-900 tracking-tight">Social & External Links</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center bg-gray-50 rounded-2xl px-5 py-2 border border-gray-200 focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-600 transition-all">
                                            <Twitter className="w-6 h-6 text-blue-400 mr-4 shrink-0" />
                                            <div className="flex-1">
                                                <label className="text-[9px] font-black text-gray-400 uppercase block">Twitter</label>
                                                <input
                                                    className="bg-transparent border-none outline-none py-1 w-full text-sm font-bold text-gray-900"
                                                    placeholder="twitter.com/yourproject"
                                                    onChange={(e) => {
                                                        const url = e.target.value;
                                                        const others = formData.socialLinks?.filter(l => l.platform !== 'twitter') || [];
                                                        setFormData({ ...formData, socialLinks: [...others, { platform: 'twitter', url }] });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center bg-gray-50 rounded-2xl px-5 py-2 border border-gray-200 focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-600 transition-all">
                                            <Linkedin className="w-6 h-6 text-blue-700 mr-4 shrink-0" />
                                            <div className="flex-1">
                                                <label className="text-[9px] font-black text-gray-400 uppercase block">LinkedIn</label>
                                                <input
                                                    className="bg-transparent border-none outline-none py-1 w-full text-sm font-bold text-gray-900"
                                                    placeholder="linkedin.com/company/..."
                                                    onChange={(e) => {
                                                        const url = e.target.value;
                                                        const others = formData.socialLinks?.filter(l => l.platform !== 'linkedin') || [];
                                                        setFormData({ ...formData, socialLinks: [...others, { platform: 'linkedin', url }] });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 5: Review */}
                    {step === 5 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-16 space-y-12 border border-gray-100 text-center"
                        >
                            <div className="space-y-4">
                                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                                    <CheckCircle2 size={48} />
                                </div>
                                <h2 className="text-5xl font-black text-gray-900 tracking-tight">Perfectly Ready!</h2>
                                <p className="text-gray-500 font-medium text-lg max-w-lg mx-auto">One last look at your vision before it goes live to the Truden community.</p>
                            </div>

                            <div className="space-y-8 text-left max-w-2xl mx-auto">
                                <div className="grid grid-cols-2 gap-10 p-10 bg-gray-50/50 rounded-[3rem] border border-gray-100 ring-1 ring-white/50 backdrop-blur-sm">
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Project Name</p>
                                        <p className="text-3xl font-black text-gray-900">{formData.name || 'Untitled'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Type & Category</p>
                                        <p className="text-xl font-black text-blue-600 uppercase tracking-tight">{formData.type} • {formData.type === ProjectType.CHARITY ? formData.category : formData.industry}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Target Amount</p>
                                        <p className="text-xl font-black text-gray-900">{formData.currency} {formData.targetAmount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Funding Ends</p>
                                        <p className="text-xl font-black text-gray-900">{formData.fundingEndDate || 'Not set'}</p>
                                    </div>
                                    <div className="col-span-2 border-t border-gray-100 pt-6">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Beneficiary</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <Users size={16} />
                                            </div>
                                            <p className="text-xl font-black text-gray-800">{formData.beneficiary}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 px-4">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                        <h4 className="font-black text-xl text-gray-900 tracking-tight">Executive Summary</h4>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed font-medium italic text-lg opacity-80">"{formData.summary}"</p>
                                </div>

                                {error && (
                                    <div className="p-8 bg-rose-50 border-4 border-rose-100 rounded-[2.5rem] text-rose-600 flex items-start gap-5 shadow-inner">
                                        <AlertCircle className="w-8 h-8 flex-shrink-0 mt-1" />
                                        <div className="space-y-1">
                                            <p className="text-lg font-black uppercase tracking-tight">We found some issues</p>
                                            <p className="text-sm font-bold opacity-80 leading-relaxed">{error}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="mt-12 flex justify-between items-center bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white/50 sticky bottom-8">
                    <button
                        onClick={prevStep}
                        disabled={step === 1 || loading}
                        className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${step === 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 active:scale-95'
                            }`}
                    >
                        <ArrowLeft className="w-5 h-5" /> Back
                    </button>

                    {step < 5 ? (
                        <button
                            onClick={nextStep}
                            className="flex items-center gap-4 bg-gray-900 hover:bg-black text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all"
                        >
                            Next Step <ArrowRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            className={`flex items-center gap-4 px-16 py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-base shadow-2xl hover:-translate-y-2 active:translate-y-0 active:scale-95 transition-all w-full md:w-auto justify-center ${loading
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white hover:shadow-blue-200'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Launch Project <CheckCircle2 className="w-7 h-7" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Utility SVGs as Components
const TrendingUpWrapper = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

const CalendarWrapper = () => (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-3 text-gray-400">
        <Calendar size={20} />
    </div>
);

const LoadingSpinner = () => (
    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
);
