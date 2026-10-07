"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CampaignVideo from "@/components/projects/CampaignVideo";
import { resolveCampaignVideo } from "@/lib/campaign-video";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  Info,
  MapPin,
  Users,
  Calendar,
  Heart,
  Target,
  Star,
  TrendingUp,
  PlaySquare,
} from "lucide-react";
import {
  projectService,
  ProjectType,
  type CreateProjectParams,
} from "@/lib/project-service";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { userService } from "@/lib/user-service";
import {
  campaignDeadlineToIso,
  formatCampaignDeadline,
  isFutureCampaignDeadline,
} from "@/lib/project-dates";

const CHARITY_CATEGORIES = [
  { label: "School", value: "school" },
  { label: "Church", value: "church" },
  { label: "Community Group", value: "community_group" },
  { label: "NGO", value: "ngo" },
  { label: "Individual", value: "individual" },
  { label: "Family", value: "family" },
];

const ROI_INDUSTRIES = [
  { label: "Technology", value: "technology" },
  { label: "Health", value: "health" },
  { label: "Education", value: "education" },
  { label: "Agriculture", value: "agriculture" },
  { label: "Energy", value: "energy" },
  { label: "Financial Services", value: "financial_services" },
  { label: "Manufacturing", value: "manufacturing" },
  { label: "Real Estate", value: "real_estate" },
  { label: "Transport", value: "transport" },
  { label: "Other", value: "other" },
];

const CHARITY_SUBCATEGORIES = [
  { label: "Health", value: "health" },
  { label: "Education", value: "education" },
  { label: "Evangelical Mission", value: "evangelical_mission" },
  { label: "Outreach", value: "outreach" },
  { label: "Relief", value: "relief" },
  { label: "Infrastructure", value: "infrastructure" },
];

const isProbablyUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    // Accept only absolute URLs for backend IsUrl validation
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

type FieldErrors = Partial<
  Record<keyof CreateProjectParams | "location" | "milestones", string>
>;
type ProjectMilestone = NonNullable<CreateProjectParams["milestones"]>[number];
type ProjectMilestoneField = keyof ProjectMilestone;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data
  ) {
    const { message } = error.response.data;
    if (
      Array.isArray(message) &&
      message.every((item): item is string => typeof item === "string")
    ) {
      return message.join(", ");
    }
    if (typeof message === "string") return message;
  }

  return error instanceof Error ? error.message : fallback;
};

export default function CreateProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    refetchUser,
  } = useAuth();
  const capabilities = user?.capabilities as
    { createCharity?: boolean; createRoi?: boolean } | undefined;
  const canCreateRoi = capabilities?.createRoi === true;
  const [step, setStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.push("/login?next=/dashboard/create-project");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Form State
  const [formData, setFormData] = useState<CreateProjectParams>({
    name: "",
    type: ProjectType.CHARITY,
    category: "ngo",
    subcategory: "education",
    industry: "technology",
    summary: "",
    story: "",
    country: "Uganda",
    location: "",
    beneficiary: "",
    paymentMethod: "FLUTTERWAVE_ESCROW",
    targetAmount: 0,
    currency: "UGX",
    fundingEndDate: "",
    website: "",
    videoUrls: [],
    galleryImages: [],
    imageUrl: "",
    socialLinks: [],
    milestones: [],
    useOfFunds: [],
  });

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const getInputClass = (field: keyof FieldErrors, baseClass: string) =>
    `${baseClass} ${fieldErrors[field] ? "border-rose-500 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : ""}`;

  const renderFieldError = (field: keyof FieldErrors) =>
    fieldErrors[field] ? (
      <p className="mt-2 text-xs font-bold text-rose-600">
        {fieldErrors[field]}
      </p>
    ) : null;

  const validateStep = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (step === 2) {
      if (!formData.name.trim() || formData.name.trim().length < 4) {
        errors.name = "Enter a project name with at least 4 characters.";
      }
      if (!formData.summary.trim() || formData.summary.trim().length < 4) {
        errors.summary = "Enter a summary with at least 4 characters.";
      }
      if (!formData.country.trim() || formData.country.trim().length < 2) {
        errors.country = "Enter the country of operation.";
      }
      if (
        !formData.beneficiary.trim() ||
        formData.beneficiary.trim().length < 2
      ) {
        errors.beneficiary = "Enter who will receive or manage the funds.";
      }
      if (formData.location && formData.location.trim().length < 2) {
        errors.location = "Location must be at least 2 characters.";
      }
    }
    if (step === 3) {
      if (!formData.story.trim() || formData.story.trim().length < 10) {
        errors.story = "Tell the story in at least 10 characters.";
      }
      if (formData.website && !isProbablyUrl(formData.website)) {
        errors.website = "Enter a valid URL starting with http:// or https://.";
      }
    }
    if (step === 4) {
      if (
        !Number.isFinite(formData.targetAmount) ||
        formData.targetAmount < 1
      ) {
        errors.targetAmount = "Enter a funding target greater than 0.";
      }
      if (
        canCreateRoi &&
        formData.type === ProjectType.ROI &&
        (!formData.milestones || formData.milestones.length === 0)
      ) {
        errors.milestones = "Add at least one milestone for ROI projects.";
      }
      if (!isFutureCampaignDeadline(formData.fundingEndDate || "")) {
        errors.fundingEndDate = "Choose a valid future campaign end date.";
      }
    }
    return errors;
  };

  const nextStep = () => {
    // Step 1: Just choosing type, handled by the Confirmation Modal
    if (step === 1) {
      setShowConfirmModal(true);
      return;
    }

    const validationErrors = validateStep();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError("Please fix the highlighted fields.");
      return;
    }

    setFieldErrors({});
    setError("");
    setStep((s) => Math.min(s + 1, 6));
  };

  const confirmTypeAndNext = () => {
    if (formData.type === ProjectType.ROI && !canCreateRoi) {
      setError(
        "Investment creation requires completed verification and eligibility approval.",
      );
      setShowConfirmModal(false);
      return;
    }
    setShowConfirmModal(false);
    setStep(2);
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleCreate = async () => {
    const fundingEndDate = campaignDeadlineToIso(formData.fundingEndDate || "");
    if (
      !fundingEndDate ||
      !isFutureCampaignDeadline(formData.fundingEndDate || "")
    ) {
      setError("Choose a valid future campaign end date.");
      setFieldErrors({
        fundingEndDate: "Choose a valid future campaign end date.",
      });
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Cleanup data before sending
      const payload: CreateProjectParams = { ...formData };
      payload.fundingEndDate = fundingEndDate;
      if (payload.milestones) {
        payload.milestones = payload.milestones.map((milestone) => ({
          ...milestone,
          dueDate: campaignDeadlineToIso(milestone.dueDate || ""),
        }));
      }
      if (payload.type === ProjectType.CHARITY) {
        delete payload.industry;
        delete payload.milestones;
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
        payload.socialLinks = payload.socialLinks.filter(
          (link) => link.url.trim().length > 0,
        );
        if (payload.socialLinks.length === 0) delete payload.socialLinks;
      }
      if (payload.galleryImages) {
        payload.galleryImages = payload.galleryImages.filter(isProbablyUrl);
        if (payload.galleryImages.length === 0) delete payload.galleryImages;
      }
      if (payload.videoUrls && payload.videoUrls.length === 0)
        delete payload.videoUrls;

      const result = await projectService.createProject(payload);
      const projectId =
        result.project?._id || result.project?.id || result._id || result.id;
      if (!projectId) {
        throw new Error("Project created but no ID returned from server");
      }

      // Invalidate queries so dashboard is fresh
      await queryClient.invalidateQueries({ queryKey: ["my-projects"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });

      router.push("/dashboard");
    } catch (error: unknown) {
      setError(
        getErrorMessage(
          error,
          "Failed to create project. Please check all fields.",
        ),
      );
      setLoading(false);
    }
  };

  const enrollAsCharityCreator = async () => {
    setEnrolling(true);
    setError("");
    try {
      await userService.enrollAsCharityCreator();
      await refetchUser();
    } catch (enrollmentError: unknown) {
      setError(
        getErrorMessage(
          enrollmentError,
          "We could not enroll your creator account.",
        ),
      );
    } finally {
      setEnrolling(false);
    }
  };

  const addMilestone = () => {
    clearFieldError("milestones");
    setFormData({
      ...formData,
      milestones: [
        ...(formData.milestones || []),
        { title: "", description: "", dueDate: "", payoutPercentage: 0 },
      ],
    });
  };

  const updateMilestone = (
    index: number,
    field: ProjectMilestoneField,
    value: ProjectMilestone[ProjectMilestoneField],
  ) => {
    const newMilestones = [...(formData.milestones || [])];
    const milestone = newMilestones[index];
    if (!milestone) return;
    newMilestones[index] = { ...milestone, [field]: value } as ProjectMilestone;
    setFormData({ ...formData, milestones: newMilestones });
  };

  const removeMilestone = (index: number) => {
    setFormData({
      ...formData,
      milestones: (formData.milestones || []).filter((_, i) => i !== index),
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "gallery" | "video" | "cover",
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;
    if (type !== "video" && !file.type.startsWith("image/")) {
      setError("Choose a valid image file.");
      e.target.value = "";
      return;
    }
    if (type === "video" && !file.type.startsWith("video/")) {
      setError("Choose a valid video file.");
      e.target.value = "";
      return;
    }
    if (type === "cover") {
      setCoverPreviewUrl(URL.createObjectURL(files[0]));
    }

    setLoading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const res = await projectService.uploadMedia(files[i]);
          // Assuming API base handle by client, res.url should be valid
          const candidateUrl = res?.url;
          if (isProbablyUrl(candidateUrl)) {
            urls.push(candidateUrl);
          }
        } catch (error: unknown) {
          const msg = getErrorMessage(error, files[i].name);
          setError(`Failed to upload: ${msg}`);
        }
      }

      // Ensure we never store invalid URLs (backend validates IsUrl)
      const safeUrls = urls.filter((u) => isProbablyUrl(u));

      if (type === "cover") {
        if (safeUrls.length > 0) {
          setFormData((prev) => ({ ...prev, imageUrl: safeUrls[0] }));
          setCoverPreviewUrl("");
        } else {
          setCoverPreviewUrl("");
          setError("Cover image upload failed. Please try another image.");
        }
      } else if (type === "gallery") {
        setFormData((prev) => ({
          ...prev,
          galleryImages: [...(prev.galleryImages || []), ...safeUrls],
          // If no cover image yet, set the first gallery image as cover
          imageUrl: prev.imageUrl || safeUrls[0] || "",
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          videoUrls: [...(prev.videoUrls || []), ...safeUrls],
        }));
      }
    } catch {
      if (type === "cover") {
        setCoverPreviewUrl("");
      }
      setError("Failed to process upload");
    } finally {
      e.target.value = "";
      setLoading(false);
    }
  };

  const addVideoUrl = (value: string) => {
    const url = value.trim();
    if (!resolveCampaignVideo(url)) {
      setError("Enter a valid YouTube, Vimeo, or direct video URL.");
      return;
    }
    setFormData((current) => ({
      ...current,
      videoUrls: [...(current.videoUrls || []), url],
    }));
    setError("");
  };

  if (
    !isAuthLoading &&
    isAuthenticated &&
    capabilities?.createCharity !== true
  ) {
    return (
      <main className="min-h-screen bg-gray-50 pt-28 px-4">
        <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-3xl font-black text-gray-900">
            Become a Charity Creator
          </h1>
          <p className="mt-4 text-gray-600">
            Enroll to create Charity campaigns. This does not approve investment
            campaigns: ROI creation separately requires verified KYC, creator
            verification, and backend eligibility approval.
          </p>
          {error && <p className="mt-4 text-rose-600">{error}</p>}
          <button
            onClick={enrollAsCharityCreator}
            disabled={enrolling}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {enrolling ? "Enrolling…" : "Become a Charity Creator"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Step Indicator */}
      <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] py-3 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold transition-colors sm:h-8 sm:w-8 ${
                    s === step
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : s < step
                        ? "bg-emerald-700 text-white"
                        : "bg-[var(--secondary)] text-[var(--text-muted)]"
                  }`}
                >
                  {s < step ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    s
                  )}
                </div>
                {s < 6 && (
                  <div
                    className={`mx-1 h-px w-3 sm:w-12 ${s < step ? "bg-emerald-700" : "bg-[var(--border)]"}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 hidden justify-between gap-2 overflow-x-auto px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] sm:flex">
            <span>Project Type</span>
            <span>Basic Info</span>
            <span>Story</span>
            <span>Funding</span>
            <span>Media</span>
            <span>Review</span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl flex-grow px-4 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Choose Path */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="card_base space-y-8"
            >
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h1 className="typography_h1">Choose project type</h1>
                <p className="typography_body">
                  Select the campaign structure that fits your project.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <button
                  aria-pressed={formData.type === ProjectType.CHARITY}
                  onClick={() =>
                    setFormData({ ...formData, type: ProjectType.CHARITY })
                  }
                  className={`relative rounded-lg border p-5 text-left transition-colors ${
                    formData.type === ProjectType.CHARITY
                      ? "border-emerald-600 bg-[var(--secondary)]"
                      : "border-[var(--border)] bg-[var(--card)] hover:border-emerald-300"
                  }`}
                >
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${formData.type === ProjectType.CHARITY ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}
                  >
                    <Heart size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-main)]">
                    Charity
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    Fund a cause, community initiative, organisation or
                    charitable project.
                  </p>
                  {formData.type === ProjectType.CHARITY && (
                    <div className="absolute right-4 top-4 text-emerald-700">
                      <CheckCircle2 size={20} />
                    </div>
                  )}
                </button>

                <button
                  aria-pressed={formData.type === ProjectType.ROI}
                  onClick={() =>
                    setFormData({ ...formData, type: ProjectType.ROI })
                  }
                  className={`relative rounded-lg border p-5 text-left transition-colors ${
                    formData.type === ProjectType.ROI
                      ? "border-violet-600 bg-[var(--secondary)]"
                      : "border-[var(--border)] bg-[var(--card)] hover:border-violet-300"
                  }`}
                >
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${formData.type === ProjectType.ROI ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-700"}`}
                  >
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-main)]">
                    Investment
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    Raise capital for an investment opportunity with financial
                    and compliance requirements.
                  </p>
                  {!canCreateRoi && (
                    <p className="mt-3 text-xs font-medium text-[var(--chip-warning-text)]">
                      Investment creation requires completed verification and
                      eligibility approval.
                    </p>
                  )}
                  {formData.type === ProjectType.ROI && (
                    <div className="absolute right-4 top-4 text-violet-700">
                      <CheckCircle2 size={20} />
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 md:p-12 space-y-8 border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setStep(1);
                  }}
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft size={18} />
                </Link>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 leading-tight">
                    Project Identity
                  </h2>
                  <p className="text-gray-500 font-medium">
                    Tell us the core details of your {formData.type} project.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      clearFieldError("name");
                      setFormData({ ...formData, name: e.target.value });
                    }}
                    placeholder="e.g. Solar Energy for Rural Schools"
                    className={getInputClass(
                      "name",
                      "w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-600 transition-all outline-none font-bold text-gray-900",
                    )}
                  />
                  {renderFieldError("name")}
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                    {formData.type === ProjectType.CHARITY
                      ? "Category"
                      : "Industry"}
                  </label>
                  <select
                    value={
                      formData.type === ProjectType.CHARITY
                        ? formData.category
                        : formData.industry
                    }
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
                    {formData.type === ProjectType.CHARITY
                      ? CHARITY_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))
                      : ROI_INDUSTRIES.map((i) => (
                          <option key={i.value} value={i.value}>
                            {i.label}
                          </option>
                        ))}
                  </select>
                </div>
                {formData.type === ProjectType.CHARITY && (
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                      Subcategory
                    </label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subcategory: e.target.value,
                        })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-100"
                    >
                      {CHARITY_SUBCATEGORIES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                    Country of Operation
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => {
                        clearFieldError("country");
                        setFormData({ ...formData, country: e.target.value });
                      }}
                      className={getInputClass(
                        "country",
                        "w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-100",
                      )}
                      placeholder="e.g. Uganda"
                    />
                  </div>
                  {renderFieldError("country")}
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                    City / Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => {
                        clearFieldError("location");
                        setFormData({ ...formData, location: e.target.value });
                      }}
                      className={getInputClass(
                        "location",
                        "w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-100",
                      )}
                      placeholder="e.g. Kampala"
                    />
                  </div>
                  {renderFieldError("location")}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                    Direct Beneficiary
                  </label>
                  <input
                    type="text"
                    value={formData.beneficiary}
                    onChange={(e) => {
                      clearFieldError("beneficiary");
                      setFormData({ ...formData, beneficiary: e.target.value });
                    }}
                    className={getInputClass(
                      "beneficiary",
                      "w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-100",
                    )}
                    placeholder="e.g. St. Jude Primary School"
                  />
                  {renderFieldError("beneficiary")}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                    Short Summary
                  </label>
                  <textarea
                    maxLength={500}
                    value={formData.summary}
                    onChange={(e) => {
                      clearFieldError("summary");
                      setFormData({ ...formData, summary: e.target.value });
                    }}
                    placeholder="Briefly describe the impact of your project in 2 sentences..."
                    className={getInputClass(
                      "summary",
                      "w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 h-28 font-medium text-gray-700 leading-relaxed",
                    )}
                  />
                  {renderFieldError("summary")}
                  <p className="text-right text-[10px] font-black text-gray-400 mt-2 px-1">
                    {formData.summary.length}/500
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Story */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl shadow-xl p-8 md:p-12 space-y-8"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-4xl font-black text-gray-900 leading-tight">
                    Tell your story
                  </h2>
                  <p className="text-gray-500 mt-2 font-medium">
                    Be authentic, transparent, and compelling.
                  </p>
                </div>
                <div className="hidden md:flex flex-col items-center bg-blue-50 p-4 rounded-2xl border border-blue-100 max-w-[200px]">
                  <Info className="w-8 h-8 text-blue-600 mb-2" />
                  <p className="text-[10px] font-bold text-blue-800 text-center leading-relaxed">
                    Longer stories build more trust with backers.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
                    Project Story (Minimum 10 chars)
                  </label>
                  <textarea
                    value={formData.story}
                    onChange={(e) => {
                      clearFieldError("story");
                      setFormData({ ...formData, story: e.target.value });
                    }}
                    placeholder="Tell the world why you started this, the challenges you face, and the exact difference you will make. Use paragraphs for readability..."
                    className={getInputClass(
                      "story",
                      "w-full px-6 py-6 bg-gray-50 border border-gray-200 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all h-[400px] font-medium text-gray-800 leading-relaxed text-lg",
                    )}
                  />
                  {renderFieldError("story")}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                    Project Website (Optional)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => {
                        clearFieldError("website");
                        setFormData({ ...formData, website: e.target.value });
                      }}
                      className={getInputClass(
                        "website",
                        "w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none",
                      )}
                      placeholder="https://yourproject.com"
                    />
                  </div>
                  {renderFieldError("website")}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Funding */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl shadow-xl p-8 md:p-12 space-y-10"
            >
              <div>
                <h2 className="text-4xl font-black text-gray-900">
                  Funding Goals
                </h2>
                <p className="text-gray-500 mt-2 font-medium">
                  Be precise about the capital you need.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 flex flex-col justify-center">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                    Total Target Amount
                  </label>
                  <div className="flex min-w-0 items-center gap-3 md:gap-4">
                    <span className="shrink-0 text-xl font-black text-gray-400 md:text-2xl">
                      UGX
                    </span>
                    <div className="min-w-0 flex-1 max-w-[10rem] overflow-hidden md:max-w-[12rem]">
                      <input
                        type="number"
                        value={formData.targetAmount || ""}
                        onChange={(e) => {
                          clearFieldError("targetAmount");
                          setFormData({
                            ...formData,
                            targetAmount: Number(e.target.value),
                          });
                        }}
                        placeholder="1000000"
                        inputMode="numeric"
                        min="0"
                        className={getInputClass(
                          "targetAmount",
                          "w-full min-w-0 bg-transparent border-none text-right text-2xl font-black leading-none tracking-tight text-blue-600 outline-none placeholder:text-gray-300 [appearance:textfield] md:text-3xl xl:text-4xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                        )}
                      />
                    </div>
                  </div>
                  {renderFieldError("targetAmount")}
                </div>
                <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                    Campaign End Date
                  </label>
                  <div className="relative">
                    <CalendarWrapper />
                    <input
                      type="date"
                      value={formData.fundingEndDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => {
                        clearFieldError("fundingEndDate");
                        setFormData({
                          ...formData,
                          fundingEndDate: e.target.value,
                        });
                      }}
                      className={getInputClass(
                        "fundingEndDate",
                        "w-full bg-transparent border-none text-2xl font-black text-gray-900 focus:outline-none",
                      )}
                    />
                  </div>
                  {renderFieldError("fundingEndDate")}
                </div>
              </div>

              {formData.type === ProjectType.ROI && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-xl text-gray-900 tracking-tight">
                      Project Milestones
                    </h3>
                    <button
                      onClick={addMilestone}
                      className="flex items-center gap-2 bg-blue-100 text-blue-600 px-5 py-2.5 rounded-xl font-black text-xs hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <Plus className="w-4 h-4" /> ADD MILESTONE
                    </button>
                  </div>

                  {(!formData.milestones ||
                    formData.milestones.length === 0) && (
                    <div
                      className={`text-center py-20 border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center ${fieldErrors.milestones ? "border-rose-200 bg-rose-50 text-rose-700" : "border-gray-100 grayscale opacity-50"}`}
                    >
                      <Target className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                        At least one milestone required
                      </p>
                      {renderFieldError("milestones")}
                    </div>
                  )}

                  <div className="space-y-6">
                    {formData.milestones?.map((milestone, idx) => (
                      <div
                        key={idx}
                        className="p-8 bg-white rounded-3xl border border-gray-200 relative group transition-all hover:border-blue-400 hover:shadow-2xl"
                      >
                        <button
                          onClick={() => removeMilestone(idx)}
                          className="absolute right-6 top-6 w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">
                              Milestone {idx + 1} Title
                            </label>
                            <input
                              type="text"
                              value={milestone.title}
                              onChange={(e) =>
                                updateMilestone(idx, "title", e.target.value)
                              }
                              placeholder="e.g. Groundbreaking & Foundations"
                              className="w-full bg-transparent border-b-4 border-gray-100 py-2 text-2xl font-black text-gray-900 focus:border-blue-500 outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">
                              Target Date
                            </label>
                            <input
                              type="date"
                              value={milestone.dueDate}
                              onChange={(e) =>
                                updateMilestone(idx, "dueDate", e.target.value)
                              }
                              className="w-full bg-gray-50 px-4 py-3 rounded-xl font-bold text-gray-900 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">
                              Budget Allocation (%)
                            </label>
                            <input
                              type="number"
                              value={milestone.payoutPercentage || ""}
                              onChange={(e) =>
                                updateMilestone(
                                  idx,
                                  "payoutPercentage",
                                  Number(e.target.value),
                                )
                              }
                              placeholder="e.g. 25"
                              className="w-full bg-gray-50 px-4 py-3 rounded-xl font-bold text-gray-900 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 5: Media */}
          {step === 5 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card_base space-y-8"
            >
              <h2 className="typography_h2">Story and media</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "cover")}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      disabled={loading}
                    />
                    <div
                      className={`flex h-full min-h-48 flex-col items-center justify-center rounded-lg border border-dashed p-5 transition-colors ${
                        coverPreviewUrl || formData.imageUrl
                          ? "border-[var(--primary)] bg-[var(--primary)]/5"
                          : "border-[var(--border)] bg-[var(--secondary)] hover:border-[var(--primary)]"
                      }`}
                    >
                      {coverPreviewUrl || formData.imageUrl ? (
                        <div className="relative w-full h-full min-h-[140px]">
                          <div
                            role="img"
                            aria-label="Project cover preview"
                            className="h-full min-h-[140px] w-full rounded-md bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${coverPreviewUrl || formData.imageUrl})`,
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                              Change Cover
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              setCoverPreviewUrl("");
                              setFormData((current) => ({
                                ...current,
                                imageUrl: "",
                              }));
                            }}
                            className="button_secondary absolute bottom-2 left-2 min-h-8 px-2 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
                            <Star className="h-5 w-5" />
                          </div>
                          <p className="text-base font-semibold text-[var(--text-main)]">
                            Featured Cover
                          </p>
                          <p className="mt-1 text-center text-xs text-[var(--text-muted)]">
                            Main image · 16:9 recommended
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="relative group">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "gallery")}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      disabled={loading}
                    />
                    <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--secondary)] p-5 transition-colors group-hover:border-[var(--primary)]">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-base font-semibold text-[var(--text-main)]">
                        Photo Gallery
                      </p>
                      <p className="mt-1 text-center text-xs text-[var(--text-muted)]">
                        Add high-quality photos
                      </p>
                    </div>
                  </div>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e, "video")}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      disabled={loading}
                    />
                    <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--secondary)] p-5 transition-colors group-hover:border-amber-500">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                        <PlaySquare className="h-5 w-5" />
                      </div>
                      <p className="text-base font-semibold text-[var(--text-main)]">
                        Video Pitch
                      </p>
                      <p className="mt-1 text-center text-xs text-[var(--text-muted)]">
                        Optional 1-2min video
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preview Section */}
                {(formData.galleryImages?.length || 0) > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                      Uploaded Images
                    </h3>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                      {formData.galleryImages?.map((url, i) => (
                        <div
                          key={i}
                          className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-md"
                        >
                          <div
                            role="img"
                            aria-label={`Project gallery image ${i + 1}`}
                            className="h-full w-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${url})` }}
                          />
                          <button
                            onClick={() =>
                              setFormData((p) => ({
                                ...p,
                                galleryImages: p.galleryImages?.filter(
                                  (_, idx) => idx !== i,
                                ),
                              }))
                            }
                            className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-[var(--border)] p-4">
                  <label
                    htmlFor="video-url"
                    className="block text-sm font-semibold text-[var(--text-main)]"
                  >
                    Video URL
                  </label>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    YouTube, Vimeo, or a direct video URL.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      id="video-url"
                      type="url"
                      placeholder="https://"
                      className="input_field"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addVideoUrl(event.currentTarget.value);
                          event.currentTarget.value = "";
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="button_secondary shrink-0"
                      onClick={(event) => {
                        const input =
                          event.currentTarget.parentElement?.querySelector<HTMLInputElement>(
                            "#video-url",
                          );
                        if (input) {
                          addVideoUrl(input.value);
                          input.value = "";
                        }
                      }}
                    >
                      Add video
                    </button>
                  </div>
                  {error && (
                    <p
                      role="alert"
                      className="mt-3 text-sm text-[var(--chip-danger-text)]"
                    >
                      {error}
                    </p>
                  )}
                  {(formData.videoUrls?.length || 0) > 0 && (
                    <ul className="mt-4 space-y-2">
                      {formData.videoUrls?.map((url, index) => (
                        <li
                          key={url}
                          className="flex items-center justify-between gap-3 rounded-md bg-[var(--secondary)] p-2 text-sm"
                        >
                          <a
                            className="min-w-0 truncate text-[var(--primary)] underline"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Video {index + 1}
                          </a>
                          <button
                            type="button"
                            aria-label={`Remove video ${index + 1}`}
                            className="text-rose-700"
                            onClick={() =>
                              setFormData((current) => ({
                                ...current,
                                videoUrls: current.videoUrls?.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              }))
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-6 pt-6 border-t border-gray-100">
                  <h3 className="font-black text-xl text-gray-900 tracking-tight">
                    Social & External Links
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center bg-gray-50 rounded-2xl px-5 py-2 border border-gray-200 focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-600 transition-all">
                      <Twitter className="w-6 h-6 text-blue-400 mr-4 shrink-0" />
                      <div className="flex-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase block">
                          Twitter
                        </label>
                        <input
                          className="bg-transparent border-none outline-none py-1 w-full text-sm font-bold text-gray-900"
                          placeholder="twitter.com/yourproject"
                          onChange={(e) => {
                            const url = e.target.value;
                            const others =
                              formData.socialLinks?.filter(
                                (l) => l.platform !== "twitter",
                              ) || [];
                            setFormData({
                              ...formData,
                              socialLinks: [
                                ...others,
                                { platform: "twitter", url },
                              ],
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center bg-gray-50 rounded-2xl px-5 py-2 border border-gray-200 focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-600 transition-all">
                      <Linkedin className="w-6 h-6 text-blue-700 mr-4 shrink-0" />
                      <div className="flex-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase block">
                          LinkedIn
                        </label>
                        <input
                          className="bg-transparent border-none outline-none py-1 w-full text-sm font-bold text-gray-900"
                          placeholder="linkedin.com/company/..."
                          onChange={(e) => {
                            const url = e.target.value;
                            const others =
                              formData.socialLinks?.filter(
                                (l) => l.platform !== "linkedin",
                              ) || [];
                            setFormData({
                              ...formData,
                              socialLinks: [
                                ...others,
                                { platform: "linkedin", url },
                              ],
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card_base space-y-6"
            >
              <div>
                <h2 className="typography_h2">Review project</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Confirm the information below before submitting it for review.
                </p>
              </div>

              <div className="space-y-5 text-left">
                <div className="grid grid-cols-1 gap-5 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">
                      Project Name
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formData.name || "Untitled"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">
                      Type & Category
                    </p>
                    <p className="text-base font-semibold text-[var(--primary)]">
                      {formData.type} •{" "}
                      {formData.type === ProjectType.CHARITY
                        ? formData.category
                        : formData.industry}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">
                      Target Amount
                    </p>
                    <p className="tabular-nums text-base font-semibold text-gray-900">
                      {formData.currency}{" "}
                      {formData.targetAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">
                      Funding Ends
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {formatCampaignDeadline(formData.fundingEndDate || "") ||
                        "Not set"}
                    </p>
                  </div>
                  <div className="col-span-2 border-t border-gray-100 pt-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">
                      Beneficiary
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Users size={16} />
                      </div>
                      <p className="text-base font-semibold text-gray-800">
                        {formData.beneficiary}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Summary</h4>
                  </div>
                  <p className="text-sm leading-6 text-gray-600">
                    {formData.summary}
                  </p>
                </div>

                {(formData.videoUrls?.length || 0) > 0 && (
                  <section
                    aria-label="Review campaign videos"
                    className="space-y-4"
                  >
                    <h3 className="typography_h3">Campaign videos</h3>
                    {formData.videoUrls?.map((url, index) => {
                      const video = resolveCampaignVideo(url);
                      return (
                        <div
                          key={`${url}-${index}`}
                          className="min-w-0 space-y-2"
                        >
                          <div className="aspect-video overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--secondary)]">
                            <CampaignVideo
                              url={url}
                              title={`Review video ${index + 1}`}
                            />
                          </div>
                          {video && (
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block break-all text-sm text-[var(--text-main)] underline"
                            >
                              {url}
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </section>
                )}

                {error && (
                  <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Submission issue</p>
                      <p className="mt-1 text-sm leading-relaxed">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="sticky bottom-4 mt-6 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm">
          <button
            onClick={prevStep}
            aria-label="Back"
            disabled={step === 1 || loading}
            className="button_secondary gap-2"
          >
            <ArrowLeft className="w-5 h-5" />{" "}
            <span className="hidden sm:inline">Back</span>
          </button>

          {step < 6 ? (
            <button onClick={nextStep} className="button_primary gap-2">
              Next Step <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading}
              className={`flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                loading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
              }`}
            >
              {loading ? (
                <>
                  <LoadingSpinner />
                  Processing...
                </>
              ) : (
                <>
                  Submit project <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setShowConfirmModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl"
            >
              <h2 className="text-xl font-semibold text-[var(--text-main)]">
                Confirm project type
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                You’re creating a{" "}
                {formData.type === ProjectType.CHARITY
                  ? "Charity"
                  : "Investment"}{" "}
                campaign. You can go back now if this is not the correct project
                type.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={confirmTypeAndNext} className="button_primary">
                  Continue
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="button_secondary"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const CalendarWrapper = () => (
  <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-3 text-gray-400">
    <Calendar size={20} />
  </div>
);

const LoadingSpinner = () => (
  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
);
