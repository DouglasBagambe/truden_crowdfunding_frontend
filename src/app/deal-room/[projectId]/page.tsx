'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, FileText, Download, Eye, Upload, Shield, Star,
  Loader2, AlertTriangle, ChevronLeft, ExternalLink,
  File, FileImage, Film, Music, Archive, X, CheckCircle,
  RefreshCw, Unlock, Info
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { dealRoomService, type DealRoomFileItem } from '@/lib/deal-room-service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/common/ToastProvider';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

// ─── Access Tiers ─────────────────────────────────────────────
const TIERS = [
  { tier: 1, label: 'Public', minInvestment: 0, description: 'Basic project information', color: 'text-gray-400', bg: 'bg-gray-500/10' },
  { tier: 2, label: 'Starter', minInvestment: 1_000, description: 'Financial statements & projections', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { tier: 3, label: 'Investor', minInvestment: 5_000, description: 'Legal documents & contracts', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { tier: 4, label: 'Whale', minInvestment: 10_000, description: 'Full due diligence package', color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

// ─── File icon helper ─────────────────────────────────────────
function FileIcon({ mimeType }: { mimeType?: string }) {
  if (!mimeType) return <File className="w-5 h-5" />;
  if (mimeType.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-400" />;
  if (mimeType.startsWith('video/')) return <Film className="w-5 h-5 text-violet-400" />;
  if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5 text-pink-400" />;
  if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-rose-400" />;
  if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="w-5 h-5 text-amber-400" />;
  return <FileText className="w-5 h-5 text-gray-400" />;
}

// ─── IPFS / PDF Preview Modal ─────────────────────────────────
function PreviewModal({ url, filename, mimeType, onClose }: { url: string; filename: string; mimeType?: string; onClose: () => void }) {
  const isImage = mimeType?.startsWith('image/');
  const isPdf = mimeType?.includes('pdf');
  const isVideo = mimeType?.startsWith('video/');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-[var(--card)] rounded-3xl border border-[var(--border)] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <FileIcon mimeType={mimeType} />
              <p className="font-black text-sm truncate max-w-md">{filename}</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl hover:bg-[var(--secondary)] transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />
              </a>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--secondary)] transition-colors">
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 min-h-[400px]">
            {isImage ? (
              <img src={url} alt={filename} className="max-w-full max-h-full mx-auto object-contain rounded-xl" />
            ) : isPdf ? (
              <iframe src={url} title={filename} className="w-full h-[60vh] rounded-xl border border-[var(--border)]" />
            ) : isVideo ? (
              <video src={url} controls className="w-full max-h-[60vh] rounded-xl" />
            ) : (
              <div className="flex flex-col items-center justify-center h-60 gap-4">
                <FileIcon mimeType={mimeType} />
                <p className="text-sm text-[var(--text-muted)] font-medium">Preview not available for this file type.</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button_primary flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> Open File
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Upload Panel ─────────────────────────────────────────────
function UploadPanel({ projectId, onUploaded }: { projectId: string; onUploaded: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('GENERAL');
  const { showSuccess, showError } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        await apiClient.post(`/deal-room/${projectId}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      showSuccess('Upload complete', `${files.length} file(s) uploaded successfully`);
      onUploaded();
    } catch (e: any) {
      showError('Upload failed', e?.response?.data?.message || e?.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] p-6 space-y-4">
      <h3 className="font-black text-sm uppercase tracking-widest">Upload Documents</h3>

      <div className="flex items-center gap-3">
        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest shrink-0">Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="input_field text-sm flex-1"
        >
          <option value="GENERAL">General</option>
          <option value="FINANCIAL">Financial</option>
          <option value="LEGAL">Legal</option>
          <option value="TECHNICAL">Technical</option>
          <option value="DUE_DILIGENCE">Due Diligence</option>
        </select>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragging ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--secondary)]'}`}
      >
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            <p className="text-sm font-bold text-[var(--text-muted)]">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-8 h-8 text-[var(--text-muted)]" />
            <p className="text-sm font-bold text-[var(--text-main)]">Drop files here or click to browse</p>
            <p className="text-xs text-[var(--text-muted)]">PDF, images, videos, documents</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function DealRoomProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = String((params as any)?.projectId || '');
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { showError } = useToast();

  const [items, setItems] = useState<DealRoomFileItem[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; filename: string; mimeType?: string } | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [userInvestment, setUserInvestment] = useState(0);
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Determine user tier based on investment amount
  const userTier = useMemo(() => {
    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (userInvestment >= TIERS[i].minInvestment) return TIERS[i].tier;
    }
    return 1;
  }, [userInvestment]);

  const load = async () => {
    try {
      setLoading(true);
      const [filesRes] = await Promise.allSettled([dealRoomService.listProjectFiles(projectId)]);
      if (filesRes.status === 'fulfilled') {
        setItems(filesRes.value.items || []);
      }
    } catch (e: any) {
      showError('Failed to load', e?.response?.data?.message || e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push(`/login?next=/deal-room/${projectId}`);
      return;
    }
    if (projectId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, projectId]);

  const openPreview = async (doc: DealRoomFileItem) => {
    try {
      setActingOn(doc.id);
      const { url } = await dealRoomService.getPreviewUrl(doc.id);
      setPreview({ url, filename: doc.filename, mimeType: doc.mimeType });
    } catch (e: any) {
      showError('Preview failed', e?.response?.data?.message || e?.message);
    } finally {
      setActingOn(null);
    }
  };

  const downloadFile = async (doc: DealRoomFileItem) => {
    try {
      setActingOn(doc.id);
      const { url } = await dealRoomService.getDownloadUrl(doc.id);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    } catch (e: any) {
      showError('Download failed', e?.response?.data?.message || e?.message);
    } finally {
      setActingOn(null);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(['ALL', ...items.map(d => d.category || 'GENERAL')]);
    return Array.from(cats);
  }, [items]);

  const filtered = useMemo(() =>
    items.filter(d => activeCategory === 'ALL' || (d.category || 'GENERAL') === activeCategory),
    [items, activeCategory]
  );

  const isCreator = user?.id && project?.creatorId === user.id;
  const isAdmin = (user?.roles || []).some((r: string) => ['ADMIN', 'admin'].includes(r));
  const canUpload = isCreator || isAdmin;

  return (
    <div className="min-h-screen bg-[var(--background)] pt-24">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-8">
          <div className="flex items-start gap-4">
            <Link href={`/projects/${projectId}`} className="p-2 rounded-xl hover:bg-[var(--secondary)] transition-colors mt-1">
              <ChevronLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Lock className="w-5 h-5 text-[var(--primary)]" />
                <h1 className="text-2xl font-black text-[var(--text-main)]">Deal Room</h1>
              </div>
              <p className="text-sm text-[var(--text-muted)] font-medium">
                Confidential investor documents. Access based on investment tier.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canUpload && (
              <button
                onClick={() => setShowUpload(v => !v)}
                className="button_primary flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {showUpload ? 'Hide Upload' : 'Upload'}
              </button>
            )}
            <button onClick={load} disabled={loading} className="p-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin text-[var(--primary)]' : 'text-[var(--text-muted)]'} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tier Access */}
            <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] p-5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Your Access Level</h3>
              {TIERS.map(t => (
                <div key={t.tier} className={`p-3 rounded-2xl border transition-all ${t.tier <= userTier ? `${t.bg} border-current/20` : 'border-[var(--border)] opacity-40'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black ${t.tier <= userTier ? t.color : 'text-[var(--text-muted)]'}`}>
                      Tier {t.tier} — {t.label}
                    </span>
                    {t.tier <= userTier ? (
                      <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] font-medium">{t.description}</p>
                  {t.minInvestment > 0 && (
                    <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1">
                      Min: ${t.minInvestment.toLocaleString()} invested
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Categories */}
            {categories.length > 1 && (
              <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] p-5 space-y-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Categories</h3>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === cat ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--secondary)]'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Upload Panel */}
            <AnimatePresence>
              {showUpload && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <UploadPanel projectId={projectId} onUploaded={load} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Files */}
            <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden">
              <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="font-black text-sm">{filtered.length} Documents</h2>
                {activeCategory !== 'ALL' && (
                  <span className="text-xs font-black text-[var(--primary)]">{activeCategory}</span>
                )}
              </div>

              {loading ? (
                <div className="p-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-[var(--secondary)] rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-[var(--text-muted)]" />
                  </div>
                  <p className="text-sm font-bold text-[var(--text-muted)]">No documents in this category.</p>
                  {canUpload && (
                    <button onClick={() => setShowUpload(true)} className="button_primary inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Upload First Document
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {filtered.map(doc => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-5 flex items-center gap-4 hover:bg-[var(--secondary)] transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center shrink-0 group-hover:bg-[var(--border)] transition-colors">
                        <FileIcon mimeType={doc.mimeType} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate">{doc.filename}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {doc.category && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                              {doc.category}
                            </span>
                          )}
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {Math.round((doc.size || 0) / 1024)} KB
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openPreview(doc)}
                          disabled={actingOn === doc.id}
                          className="p-2 rounded-xl hover:bg-[var(--border)] transition-colors text-[var(--text-muted)] hover:text-[var(--primary)]"
                          title="Preview"
                        >
                          {actingOn === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => downloadFile(doc)}
                          disabled={actingOn === doc.id || !doc.canDownload}
                          title={!doc.canDownload ? 'Upgrade your investment tier to download' : 'Download'}
                          className={`p-2 rounded-xl transition-colors ${!doc.canDownload ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-emerald-400'}`}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {!doc.canDownload && (
                          <div className="p-2 rounded-xl" title="Higher tier required">
                            <Lock className="w-4 h-4 text-amber-400" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* IPFS notice */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Documents are stored on IPFS for tamper-proof, decentralized access.
                Your investment tier determines which documents you can view and download.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      {preview && (
        <PreviewModal
          url={preview.url}
          filename={preview.filename}
          mimeType={preview.mimeType}
          onClose={() => setPreview(null)}
        />
      )}

      <Footer />
    </div>
  );
}
