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
    Info
} from 'lucide-react';
import { projectService, ProjectType, type CreateProjectParams } from '@/lib/project-service';

const CATEGORIES = [
    'Technology', 'Health', 'Education', 'Environment', 'Creative Arts',
    'Agriculture', 'Disaster Relief', 'Community Development', 'Sports', 'Other'
];

export default function CreateProjectPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState<CreateProjectParams>({
        name: '',
        projectType: ProjectType.CHARITY,
        category: CATEGORIES[0],
        summary: '',
        story: '',
        targetAmount: 0,
        currency: 'UGX',
        fundingEndDate: '',
        milestones: [],
        mediaUrls: {
            videoUrls: [],
            galleryImages: [],
        },
        socialLinks: {
            website: '',
            twitter: '',
            linkedin: '',
        }
    });

    const nextStep = () => setStep(s => Math.min(s + 1, 5));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleCreate = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await projectService.createProject(formData);
            router.push(`/dashboard/projects/${result._id}`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create project. Please check all fields.');
            setLoading(false);
        }
    };

    const addMilestone = () => {
        setFormData({
            ...formData,
            milestones: [...formData.milestones, { title: '', description: '', amount: 0 }]
        });
    };

    const updateMilestone = (index: number, field: string, value: any) => {
        const newMilestones = [...formData.milestones];
        newMilestones[index] = { ...newMilestones[index], [field]: value };
        setFormData({ ...formData, milestones: newMilestones });
    };

    const removeMilestone = (index: number) => {
        setFormData({
            ...formData,
            milestones: formData.milestones.filter((_, i) => i !== index)
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Step Indicator */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <div key={s} className="flex items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${s === step
                                            ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100'
                                            : s < step
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                        }`}
                                >
                                    {s < step ? <CheckCircle2 className="w-6 h-6" /> : s}
                                </div>
                                {s < 5 && (
                                    <div className={`h-1 w-12 md:w-24 mx-2 rounded-full ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-medium text-gray-500 px-1">
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
                            className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
                        >
                            <h2 className="text-3xl font-bold text-gray-900 border-l-4 border-blue-600 pl-4">Let's start with the basics</h2>
                            <p className="text-gray-600">Choose your project type and give it a compelling name.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setFormData({ ...formData, projectType: ProjectType.CHARITY })}
                                    className={`p-6 border-2 rounded-xl text-left transition-all ${formData.projectType === ProjectType.CHARITY
                                            ? 'border-blue-600 bg-blue-50 shadow-md'
                                            : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <p className="text-xl font-bold text-gray-900 mb-1">Charity</p>
                                    <p className="text-sm text-gray-500">Raise funds for a social cause without expecting financial returns.</p>
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, projectType: ProjectType.ROI })}
                                    className={`p-6 border-2 rounded-xl text-left transition-all ${formData.projectType === ProjectType.ROI
                                            ? 'border-purple-600 bg-purple-50 shadow-md'
                                            : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <p className="text-xl font-bold text-gray-900 mb-1">ROI / Investment</p>
                                    <p className="text-sm text-gray-500">Enable investors to earn returns from your business venture.</p>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Project Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Solar Energy for Rural Uganda"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Short Summary (max 150 chars)</label>
                                    <textarea
                                        maxLength={150}
                                        value={formData.summary}
                                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                        placeholder="Briefly describe your project..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24"
                                    />
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
                            className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
                        >
                            <h2 className="text-3xl font-bold text-gray-900 border-l-4 border-blue-600 pl-4">Tell your story</h2>
                            <p className="text-gray-600">Explain why this project matters and what you aim to achieve.</p>

                            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start border border-blue-100">
                                <Info className="w-6 h-6 text-blue-600 shrink-0" />
                                <p className="text-sm text-blue-800">Projects with a personal, compelling story are 3x more likely to reach their target.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Project Description</label>
                                <textarea
                                    value={formData.story}
                                    onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                                    placeholder="Share the full details of your project, your impact, and your team..."
                                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-96 font-sans leading-relaxed"
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Funding */}
                    {step === 3 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white rounded-2xl shadow-xl p-8 space-y-8"
                        >
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 border-l-4 border-blue-600 pl-4">Funding & Milestones</h2>
                                <p className="text-gray-600 mt-2">Break down how much you need and how you'll spend it.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Target Amount (UGX)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            value={formData.targetAmount || ''}
                                            onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                                            placeholder="0"
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Funding End Date</label>
                                    <input
                                        type="date"
                                        value={formData.fundingEndDate}
                                        onChange={(e) => setFormData({ ...formData, fundingEndDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-gray-900">Project Milestones</h3>
                                    <button
                                        onClick={addMilestone}
                                        className="flex items-center gap-2 text-sm text-blue-600 font-bold hover:text-blue-700 transition-colors"
                                    >
                                        <Plus className="w-5 h-5" /> Add Milestone
                                    </button>
                                </div>

                                {formData.milestones.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 text-gray-400 italic">
                                        Add at least one milestone to track your project's progress.
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {formData.milestones.map((milestone, idx) => (
                                        <div key={idx} className="p-6 bg-gray-50 rounded-2xl border border-gray-200 relative group transition-all hover:bg-white hover:shadow-lg">
                                            <button
                                                onClick={() => removeMilestone(idx)}
                                                className="absolute right-4 top-4 text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Milestone Title</label>
                                                    <input
                                                        type="text"
                                                        value={milestone.title}
                                                        onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                                                        placeholder="e.g. Purchase of Equipment"
                                                        className="w-full mt-1 bg-transparent border-b-2 border-gray-200 py-1 font-semibold text-gray-900 focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Amount Required (UGX)</label>
                                                    <input
                                                        type="number"
                                                        value={milestone.amount || ''}
                                                        onChange={(e) => updateMilestone(idx, 'amount', Number(e.target.value))}
                                                        className="w-full mt-1 bg-transparent border-b-2 border-gray-200 py-1 font-semibold text-gray-900 focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                                                    <input
                                                        type="text"
                                                        value={milestone.description}
                                                        onChange={(e) => updateMilestone(idx, 'description', e.target.value)}
                                                        className="w-full mt-1 bg-transparent border-b-2 border-gray-200 py-1 font-medium text-gray-700 focus:border-blue-500 outline-none"
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
                            className="bg-white rounded-2xl shadow-xl p-8 space-y-8"
                        >
                            <h2 className="text-3xl font-bold text-gray-900 border-l-4 border-blue-600 pl-4">Media & Links</h2>
                            <p className="text-gray-600">Bring your project to life with visuals and social presence.</p>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all group cursor-pointer">
                                        <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Upload className="w-8 h-8" />
                                        </div>
                                        <p className="font-bold text-gray-900">Upload Main Project Image</p>
                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                                    </div>
                                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all group cursor-pointer">
                                        <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-8 h-8" />
                                        </div>
                                        <p className="font-bold text-gray-900">Upload Project Gallery</p>
                                        <p className="text-xs text-gray-500 mt-1">Select multiple images</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg text-gray-900">Social Presence</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-center bg-gray-50 rounded-xl px-4 py-1 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 group">
                                            <Globe className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                                            <input
                                                className="bg-transparent border-none outline-none py-2 w-full text-sm font-medium"
                                                placeholder="Website URL"
                                                value={formData.socialLinks?.website}
                                                onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, website: e.target.value } })}
                                            />
                                        </div>
                                        <div className="flex items-center bg-gray-50 rounded-xl px-4 py-1 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 group">
                                            <Twitter className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                                            <input
                                                className="bg-transparent border-none outline-none py-2 w-full text-sm font-medium"
                                                placeholder="Twitter Handle"
                                                value={formData.socialLinks?.twitter}
                                                onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, twitter: e.target.value } })}
                                            />
                                        </div>
                                        <div className="flex items-center bg-gray-50 rounded-xl px-4 py-1 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 group">
                                            <Linkedin className="w-5 h-5 text-blue-700 mr-3 shrink-0" />
                                            <input
                                                className="bg-transparent border-none outline-none py-2 w-full text-sm font-medium"
                                                placeholder="LinkedIn Profile"
                                                value={formData.socialLinks?.linkedin}
                                                onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, linkedin: e.target.value } })}
                                            />
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
                            className="bg-white rounded-2xl shadow-xl p-8 space-y-8"
                        >
                            <div className="text-center">
                                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                                <h2 className="text-3xl font-bold text-gray-900">Perfectly Ready!</h2>
                                <p className="text-gray-600">Please review your project details before submitting.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Project Name</p>
                                        <p className="text-lg font-bold text-gray-900">{formData.name || 'Untitled'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Type & Category</p>
                                        <p className="text-lg font-bold text-blue-600 capitalize">{formData.projectType.toLowerCase()} • {formData.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Target Amount</p>
                                        <p className="text-lg font-bold text-gray-900">{formData.currency} {formData.targetAmount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Funding Ends</p>
                                        <p className="text-lg font-bold text-gray-900">{formData.fundingEndDate || 'Not set'}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                                        <FileText className="w-5 h-5 text-blue-600" /> Summary
                                    </h4>
                                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl italic">"{formData.summary}"</p>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
                                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                                        <p className="text-sm font-medium">{error}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-between items-center bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
                    <button
                        onClick={prevStep}
                        disabled={step === 1 || loading}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${step === 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <ArrowLeft className="w-5 h-5" /> Back
                    </button>

                    {step < 5 ? (
                        <button
                            onClick={nextStep}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-blue-200 shadow-lg hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50"
                        >
                            Continue <ArrowRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-bold shadow-xl shadow-blue-200 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Plus className="w-6 h-6 animate-spin" />
                                    Creating Project...
                                </>
                            ) : (
                                <>
                                    Submit Project Review <CheckCircle2 className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
