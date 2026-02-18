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

type Step = 'basics' | 'details' | 'funding' | 'milestones' | 'review';

export default function CreateProjectWizard({ isOpen, onClose }: CreateProjectWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('basics');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Basics
    name: '',
    category: '',
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
    useOfFunds: [] as Array<{ item: string; amount: string; percentage: string }>,
    
    // Milestones
    milestones: [] as Array<{ title: string; description: string; amount: string; dueDate: string }>,
  });

  const steps: Step[] = ['basics', 'details', 'funding', 'milestones', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
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
      // Convert form data to API format
      const projectData = {
        name: formData.name,
        category: formData.category,
        projectType: formData.projectType,
        summary: formData.summary,
        description: formData.description,
        story: formData.story,
        website: formData.website,
        imageUrl: formData.imageUrl,
        goalAmount: parseFloat(formData.goalAmount),
        targetAmount: parseFloat(formData.goalAmount),
        deadline: formData.deadline,
        useOfFunds: formData.useOfFunds.map(item => ({
          item: item.item,
          amount: parseFloat(item.amount),
          percentage: parseFloat(item.percentage),
        })),
        milestones: formData.milestones.map(m => ({
          title: m.title,
          description: m.description,
          amount: parseFloat(m.amount),
          dueDate: m.dueDate,
        })),
      };

      await projectService.createProject(projectData);
      
      // Success - redirect to creator dashboard
      router.push('/dashboard/creator');
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
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
    </div>
  );
}

// Step Components
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
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter project name"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Category *
      </label>
      <select
        value={formData.category}
        onChange={(e) => updateFormData('category', e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Select category</option>
        <option value="TECHNOLOGY">Technology</option>
        <option value="EDUCATION">Education</option>
        <option value="HEALTH">Health</option>
        <option value="ENVIRONMENT">Environment</option>
        <option value="COMMUNITY">Community</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Project Type *
      </label>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => updateFormData('projectType', 'ROI')}
          className={`p-4 border-2 rounded-lg transition-all ${
            formData.projectType === 'ROI'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <p className="font-semibold text-gray-900">ROI Investment</p>
          <p className="text-sm text-gray-600 mt-1">Investors receive returns</p>
        </button>
        <button
          type="button"
          onClick={() => updateFormData('projectType', 'CHARITY')}
          className={`p-4 border-2 rounded-lg transition-all ${
            formData.projectType === 'CHARITY'
              ? 'border-pink-600 bg-pink-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <p className="font-semibold text-gray-900">Charity</p>
          <p className="text-sm text-gray-600 mt-1">Donation-based funding</p>
        </button>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Project Summary *
      </label>
      <textarea
        value={formData.summary}
        onChange={(e) => updateFormData('summary', e.target.value)}
        rows={3}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Brief description of your project (max 200 characters)"
        maxLength={200}
      />
      <p className="text-sm text-gray-500 mt-1">{formData.summary.length}/200 characters</p>
    </div>
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
        Project Image URL
      </label>
      <input
        type="url"
        value={formData.imageUrl}
        onChange={(e) => updateFormData('imageUrl', e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="https://example.com/image.jpg"
      />
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
          <input
            type="number"
            value={formData.goalAmount}
            onChange={(e) => updateFormData('goalAmount', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="100000"
          />
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
      { title: '', description: '', amount: '', dueDate: '' }
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
              <input
                type="number"
                value={milestone.amount}
                onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                placeholder="Amount"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
      <dl className="space-y-2">
        <div className="flex justify-between">
          <dt className="text-gray-600">Name:</dt>
          <dd className="font-medium text-gray-900">{formData.name || 'Not set'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">Category:</dt>
          <dd className="font-medium text-gray-900">{formData.category || 'Not set'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">Type:</dt>
          <dd className="font-medium text-gray-900">{formData.projectType}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">Goal:</dt>
          <dd className="font-medium text-gray-900">${formData.goalAmount || '0'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">Deadline:</dt>
          <dd className="font-medium text-gray-900">{formData.deadline || 'Not set'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">Milestones:</dt>
          <dd className="font-medium text-gray-900">{formData.milestones.length}</dd>
        </div>
      </dl>
    </div>
  </motion.div>
);

// Helper function
const getStepTitle = (step: Step): string => {
  const titles: Record<Step, string> = {
    basics: 'Basic Information',
    details: 'Project Details',
    funding: 'Funding Goals',
    milestones: 'Milestones',
    review: 'Review & Submit',
  };
  return titles[step];
};
