'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { dealRoomService, type DealRoomFileItem } from '@/lib/deal-room-service';
import { useAuth } from '@/hooks/useAuth';

export default function DealRoomProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = String((params as any)?.projectId || '');
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [items, setItems] = useState<DealRoomFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await dealRoomService.listProjectFiles(projectId);
      setItems(res.items || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load deal room files');
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
    if (projectId) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, projectId]);

  const rows = useMemo(() => {
    return (items || []).map((d) => ({ ...d, _id: d.id }));
  }, [items]);

  const openPreview = async (documentId: string) => {
    try {
      setActingOn(documentId);
      const { url } = await dealRoomService.getPreviewUrl(documentId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to open preview');
    } finally {
      setActingOn(null);
    }
  };

  const download = async (documentId: string) => {
    try {
      setActingOn(documentId);
      const { url } = await dealRoomService.getDownloadUrl(documentId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to download');
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="pt-24 bg-[var(--background)] min-h-screen">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--text-main)]">Deal Room</h1>
            <p className="text-sm text-[var(--text-muted)] font-medium">
              Project documents. Access depends on your role and any grants.
            </p>
          </div>

          <button
            className="button_primary px-5 py-3"
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300 text-sm font-medium mb-6">
            {error}
          </div>
        )}

        <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {rows.map((d: any) => (
              <div key={d._id} className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-300">
                      {d.mimeType}
                    </span>
                    {d.category && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300">
                        {d.category}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-black text-[var(--text-main)] break-words">{d.filename}</h2>
                  <p className="text-xs text-[var(--text-muted)] font-semibold">
                    {Math.round((d.size || 0) / 1024)} KB • {new Date(d.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="lg:col-span-5 flex flex-wrap gap-2 justify-start lg:justify-end items-center">
                  <button
                    className="px-4 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] hover:opacity-90 disabled:opacity-60"
                    onClick={() => openPreview(d._id)}
                    disabled={actingOn === d._id}
                  >
                    Preview
                  </button>

                  <button
                    className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-60"
                    onClick={() => download(d._id)}
                    disabled={actingOn === d._id || !d.canDownload}
                    title={!d.canDownload ? 'No download permission' : undefined}
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}

            {!loading && rows.length === 0 && (
              <div className="p-10 text-center text-sm text-[var(--text-muted)] font-medium">
                No documents yet.
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
