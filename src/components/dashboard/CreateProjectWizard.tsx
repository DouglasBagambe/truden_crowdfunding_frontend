'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowLeft, ArrowRight, CheckCircle,
  FileText, DollarSign, Calendar, Target,
  Upload, Plus, Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { projectService } from '@/lib/project-service';

interface CreateProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'type' | 'basics' | 'details' | 'funding' | 'milestones' | 'review';

const isProbablyUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function CreateProjectWizard({ isOpen, onClose }: CreateProjectWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('type');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypeConfirmation, setShowTypeConfirmation] = useState(false);

  const [formData, setFormData] = useState({
    // Basics
    name: '',
    category: '',
    subcategory: '', // Added subcategory
    industry: '',
    country: 'Uganda',
    beneficiary: '',
    projectType: 'ROI',
    summary: '',

    // Details
    description: '',
    story: '',
    website: '',
    imageUrl: '',

    // Funding
    goalAmount: '',
    deadline: '',
    currency: 'UGX',
    paymentMethod: 'Mobile Money',
    useOfFunds: [] as Array<{ item: string; amount: string; percentage: string }>,

    // Milestones
    milestones: [] as Array<{ title: string; description: string; amount: string; payoutPercentage: string; dueDate: string }>,
  });

  const steps: Step[] = ['type', 'basics', 'details', 'funding', 'milestones', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep === 'type') {
      setShowTypeConfirmation(true);
      return;
    }
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const confirmTypeAndProceed = () => {
    setShowTypeConfirmation(false);
    setCurrentStep('basics');
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Convert form data to API format matching CreateProjectDto
      const projectData: any = {
        name: formData.name,
        type: formData.projectType, // Backend expects 'type'
        summary: formData.summary,
        story: formData.story || formData.description, // Backend story is mandatory
        country: formData.country,
        beneficiary: formData.beneficiary,
        paymentMethod: formData.paymentMethod,
        targetAmount: parseFloat(formData.goalAmount), // Backend expects 'targetAmount'
        currency: formData.currency,
        fundingEndDate: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,

        // Conditional category/industry
        ...(formData.projectType === 'ROI'
          ? { industry: formData.industry || 'technology' }
          : {
            category: formData.category || 'community_group',
            subcategory: formData.subcategory || 'outreach'
          }
        ),

        useOfFunds: formData.useOfFunds.map(item => ({
          item: item.item,
          amount: parseFloat(item.amount || '0'),
          percentage: parseFloat(item.percentage || '0'),
        })),

        milestones: formData.milestones.map(m => ({
          title: m.title,
          description: m.description,
          payoutPercentage: parseFloat(m.payoutPercentage || '0'), // Backend expects payoutPercentage
          dueDate: m.dueDate ? new Date(m.dueDate).toISOString() : undefined,
        })),
      };

      // Sanitize optional URL fields so backend IsUrl validators don't fail
      if (!isProbablyUrl(projectData.imageUrl)) delete projectData.imageUrl;
      if (!isProbablyUrl(projectData.website)) delete projectData.website;

      console.log('[CREATE_PROJECT_WIZARD_DEBUG] createProject payload:', projectData);

      const res = await projectService.createProject(projectData);

      // Success - redirect to the new project detail page
      const newProjectId = (res as any).id || (res as any)._id;
      if (newProjectId) {
        router.push(`/projects/${newProjectId}`);
      } else {
        router.push('/dashboard');
      }
      onClose();
    } catch (error: any) {
      console.error('[CREATE_PROJECT_WIZARD_DEBUG] Error creating project:', error);
      console.error('[CREATE_PROJECT_WIZARD_DEBUG] Error Response:', error.response?.data);

      const errorMessage = error.response?.data?.message;
      const errorDetail = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;

      alert(errorDetail ? `Failed to create project: ${errorDetail}` : 'Failed to create project. Please check if all fields are correctly filled.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStepIndex + 1} of {steps.length}: {getStepTitle(currentStep)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-gray-200">
            <motion.div
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <AnimatePresence mode="wait">
              {currentStep === 'type' && (
                <TypeStep formData={formData} updateFormData={updateFormData} />
              )}
              {currentStep === 'basics' && (
                <BasicsStep formData={formData} updateFormData={updateFormData} />
              )}
              {currentStep === 'details' && (
                <DetailsStep formData={formData} updateFormData={updateFormData} />
              )}
              {currentStep === 'funding' && (
                <FundingStep formData={formData} updateFormData={updateFormData} />
              )}
              {currentStep === 'milestones' && (
                <MilestonesStep formData={formData} updateFormData={updateFormData} />
              )}
              {currentStep === 'review' && (
                <ReviewStep formData={formData} />
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {currentStepIndex < steps.length - 1 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Type Confirmation Modal */}
      <AnimatePresence>
        {showTypeConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Project Type</h3>
              <p className="text-gray-600 mb-6">
                You are about to create an <strong>{formData.projectType === 'ROI' ? 'ROI Investment' : 'Charity'}</strong> project.
                {formData.projectType === 'ROI'
                  ? ' Please note that investors will expect financial returns or equity as defined by your milestones.'
                  : ' This is a donation-based model where backers do not expect direct financial returns.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTypeConfirmation(false)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTypeAndProceed}
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Yes, Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Step Components
const TypeStep = ({ formData, updateFormData }: any) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center mb-8">
      <h3 className="text-xl font-bold text-gray-900">What kind of project are you creating?</h3>
      <p className="text-sm text-gray-500 mt-2">Choose the funding model that best suits your goals.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <button
        type="button"
        onClick={() => updateFormData('projectType', 'ROI')}
        className={`p-6 border-2 rounded-xl text-left transition-all ${formData.projectType === 'ROI'
          ? 'border-blue-600 bg-blue-50 relative overflow-hidden'
          : 'border-gray-200 hover:border-gray-300'
          }`}
      >
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 shadow-sm">
          <DollarSign className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-lg text-gray-900 mb-2">ROI Investment</h4>
        <p className="text-sm text-gray-600 leading-relaxed font-medium">
          Standard investment projects where backers expect a financial return. This is ideal for startups, businesses, or revenue-generating projects. You will share a percentage of revenue or pay back the principal with interest over your selected milestones, creating a sustainable ecosystem for your growth and investor profits.
        </p>
        <div className={`absolute top-4 right-4 transition-all duration-300 ${formData.projectType === 'ROI' ? 'opacity-100 scale-100 text-blue-600' : 'opacity-0 scale-50'}`}>
          <CheckCircle className="w-6 h-6" />
        </div>
      </button>

      <button
        type="button"
        onClick={() => updateFormData('projectType', 'CHARITY')}
        className={`p-6 border-2 rounded-xl text-left transition-all ${formData.projectType === 'CHARITY'
          ? 'border-emerald-600 bg-emerald-50 relative overflow-hidden'
          : 'border-gray-200 hover:border-gray-300'
          }`}
      >
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4 shadow-sm">
          <Target className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-lg text-gray-900 mb-2">Charity & Donation</h4>
        <p className="text-sm text-gray-600 leading-relaxed font-medium">
          Projects focused on social good, community drives, or non-profit goals. Backers donate funds purely for impact and social rewards. This model is perfect for medical emergencies, community infrastructure, or environmental causes where the "return" is the positive change you create in the world.
        </p>
        <div className={`absolute top-4 right-4 transition-all duration-300 ${formData.projectType === 'CHARITY' ? 'opacity-100 scale-100 text-emerald-600' : 'opacity-0 scale-50'}`}>
          <CheckCircle className="w-6 h-6" />
        </div>
      </button>
    </div>
  </motion.div>
);
const BasicsStep = ({ formData, updateFormData }: any) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Project Name *
      </label>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => updateFormData('name', e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Enter project name"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Project Summary *
      </label>
      <textarea
        value={formData.summary}
        onChange={(e) => updateFormData('summary', e.target.value)}
        rows={3}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Brief description (max 200 characters)"
        maxLength={200}
      />
      <p className="text-sm text-gray-500 mt-1">{formData.summary.length}/200 characters</p>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Country *
        </label>
        <input
          type="text"
          value={formData.country}
          onChange={(e) => updateFormData('country', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Uganda"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Beneficiary *
        </label>
        <input
          type="text"
          value={formData.beneficiary}
          onChange={(e) => updateFormData('beneficiary', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Who receives funds?"
        />
      </div>
    </div>

    {formData.projectType === 'ROI' ? (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Industry *
        </label>
        <select
          value={formData.industry}
          onChange={(e) => updateFormData('industry', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select industry</option>
          <option value="technology">Technology</option>
          <option value="agriculture">Agriculture</option>
          <option value="real_estate">Real Estate</option>
          <option value="financial_services">Finance</option>
          <option value="energy">Energy</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="transport">Transport</option>
          <option value="education">Education</option>
          <option value="health">Health</option>
          <option value="other">Other</option>
        </select>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => updateFormData('category', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select category</option>
            <option value="school">School</option>
            <option value="church">Church</option>
            <option value="community_group">Community Group</option>
            <option value="ngo">NGO</option>
            <option value="individual">Individual</option>
            <option value="family">Family</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcategory *
          </label>
          <select
            value={formData.subcategory}
            onChange={(e) => updateFormData('subcategory', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select subcategory</option>
            <option value="health">Health</option>
            <option value="education">Education</option>
            <option value="evangelical_mission">Evangelical Mission</option>
            <option value="outreach">Outreach</option>
            <option value="relief">Relief</option>
            <option value="infrastructure">Infrastructure</option>
          </select>
        </div>
      </div>
    )}
  </motion.div>
);

const DetailsStep = ({ formData, updateFormData }: any) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Full Description *
      </label>
      <textarea
        value={formData.description}
        onChange={(e) => updateFormData('description', e.target.value)}
        rows={4}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Detailed description of your project"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Project Story
      </label>
      <textarea
        value={formData.story}
        onChange={(e) => updateFormData('story', e.target.value)}
        rows={6}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Tell the story behind your project..."
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Website
      </label>
      <input
        type="url"
        value={formData.website}
        onChange={(e) => updateFormData('website', e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="https://yourproject.com"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Project Image
      </label>
      <div className="flex items-center gap-4">
        {formData.imageUrl && (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
            <img src={formData.imageUrl} className="w-full h-full object-cover" />
            <button
              onClick={() => updateFormData('imageUrl', '')}
              className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
        <div className="relative flex-1">
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const res = await projectService.uploadMedia(file);
                console.log('[CREATE_PROJECT_WIZARD_DEBUG] uploadMedia response:', res);
                const candidateUrl = (res as any)?.url;
                if (isProbablyUrl(candidateUrl)) {
                  updateFormData('imageUrl', candidateUrl);
                } else {
                  console.warn('[CREATE_PROJECT_WIZARD_DEBUG] uploadMedia returned invalid url:', candidateUrl);
                  updateFormData('imageUrl', '');
                }
              } catch (err) {
                console.error('[CREATE_PROJECT_WIZARD_DEBUG] Upload failed', err);
              }
            }}
            className="hidden"
            id="cover-upload-wizard"
          />
          <label
            htmlFor="cover-upload-wizard"
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 cursor-pointer transition-all"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-600">Click to upload cover image</span>
          </label>
        </div>
      </div>
    </div>
  </motion.div>
);

const FundingStep = ({ formData, updateFormData }: any) => {
  const addUseOfFund = () => {
    updateFormData('useOfFunds', [
      ...formData.useOfFunds,
      { item: '', amount: '', percentage: '' }
    ]);
  };

  const removeUseOfFund = (index: number) => {
    updateFormData('useOfFunds', formData.useOfFunds.filter((_: any, i: number) => i !== index));
  };

  const updateUseOfFund = (index: number, field: string, value: string) => {
    const updated = [...formData.useOfFunds];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData('useOfFunds', updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Funding Goal *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-gray-400 font-bold">
              {formData.currency}
            </span>
            <input
              type="number"
              value={formData.goalAmount}
              onChange={(e) => updateFormData('goalAmount', e.target.value)}
              className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="100000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Deadline *
          </label>
          <input
            type="date"
            value={formData.deadline}
            onChange={(e) => updateFormData('deadline', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency *
          </label>
          <select
            value={formData.currency}
            onChange={(e) => updateFormData('currency', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="UGX">Ugandan Shilling (UGX)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="KES">Kenyan Shilling (KES)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method *
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => updateFormData('paymentMethod', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Mobile Money">Mobile Money (M-Pesa/Airtel)</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Crypto">Crypto (USDC)</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Use of Funds
          </label>
          <button
            type="button"
            onClick={addUseOfFund}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {formData.useOfFunds.map((item: any, index: number) => (
            <div key={index} className="flex gap-3">
              <input
                type="text"
                value={item.item}
                onChange={(e) => updateUseOfFund(index, 'item', e.target.value)}
                placeholder="Item name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                value={item.percentage}
                onChange={(e) => updateUseOfFund(index, 'percentage', e.target.value)}
                placeholder="%"
                className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => removeUseOfFund(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const MilestonesStep = ({ formData, updateFormData }: any) => {
  const addMilestone = () => {
    updateFormData('milestones', [
      ...formData.milestones,
      { title: '', description: '', amount: '', payoutPercentage: '', dueDate: '' }
    ]);
  };

  const removeMilestone = (index: number) => {
    updateFormData('milestones', formData.milestones.filter((_: any, i: number) => i !== index));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const updated = [...formData.milestones];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData('milestones', updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Project Milestones</h3>
          <p className="text-sm text-gray-600 mt-1">Define key milestones for fund release</p>
        </div>
        <button
          type="button"
          onClick={addMilestone}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Milestone
        </button>
      </div>

      <div className="space-y-4">
        {formData.milestones.map((milestone: any, index: number) => (
          <div key={index} className="p-4 border-2 border-gray-200 rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-gray-700">Milestone {index + 1}</p>
              <button
                type="button"
                onClick={() => removeMilestone(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={milestone.title}
              onChange={(e) => updateMilestone(index, 'title', e.target.value)}
              placeholder="Milestone title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <textarea
              value={milestone.description}
              onChange={(e) => updateMilestone(index, 'description', e.target.value)}
              rows={2}
              placeholder="Milestone description"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={milestone.dueDate}
                onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="relative">
                <input
                  type="number"
                  value={milestone.payoutPercentage}
                  onChange={(e) => updateMilestone(index, 'payoutPercentage', e.target.value)}
                  placeholder="Payout %"
                  className="w-full pr-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-2.5 text-gray-400">%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const ReviewStep = ({ formData }: any) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-sm text-blue-800">
        Please review all information before submitting. You can go back to edit any section.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Overview</h3>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
        <div className="flex justify-between border-b border-gray-100 py-1">
          <dt className="text-gray-600">Name:</dt>
          <dd className="font-medium text-gray-900">{formData.name || 'Not set'}</dd>
        </div>
        <div className="flex justify-between border-b border-gray-100 py-1">
          <dt className="text-gray-600">Type:</dt>
          <dd className="font-medium text-gray-900">{formData.projectType}</dd>
        </div>
        <div className="flex justify-between border-b border-gray-100 py-1">
          <dt className="text-gray-600">{formData.projectType === 'ROI' ? 'Industry:' : 'Category:'}</dt>
          <dd className="font-medium text-gray-900">{formData.projectType === 'ROI' ? formData.industry : formData.category || 'Not set'}</dd>
        </div>
        <div className="flex justify-between border-b border-gray-100 py-1">
          <dt className="text-gray-600">Country:</dt>
          <dd className="font-medium text-gray-900">{formData.country}</dd>
        </div>
        <div className="flex justify-between border-b border-gray-100 py-1">
          <dt className="text-gray-600">Beneficiary:</dt>
          <dd className="font-medium text-gray-900">{formData.beneficiary || 'Not set'}</dd>
        </div>
        <div className="flex justify-between border-b border-gray-100 py-1">
          <dt className="text-gray-600">Goal:</dt>
          <dd className="font-medium text-gray-900">{formData.currency} {parseFloat(formData.goalAmount || '0').toLocaleString()}</dd>
        </div>
        <div className="flex justify-between border-b border-gray-100 py-1">
          <dt className="text-gray-600">Deadline:</dt>
          <dd className="font-medium text-gray-900">{formData.deadline || 'Not set'}</dd>
        </div>
        <div className="flex justify-between border-b border-gray-100 py-1">
          <dt className="text-gray-600">Payment:</dt>
          <dd className="font-medium text-gray-900">{formData.paymentMethod}</dd>
        </div>
        <div className="flex justify-between border-b border-gray-100 py-1 col-span-2">
          <dt className="text-gray-600">Milestones:</dt>
          <dd className="font-medium text-gray-900">{formData.milestones.length} milestones defined</dd>
        </div>
      </dl>
    </div>
  </motion.div>
);

// Helper function
const getStepTitle = (step: Step): string => {
  const titles: Record<Step, string> = {
    type: 'Project Type',
    basics: 'Basic Information',
    details: 'Project Details',
    funding: 'Funding Goals',
    milestones: 'Milestones',
    review: 'Review & Submit',
  };
  return titles[step];
};
