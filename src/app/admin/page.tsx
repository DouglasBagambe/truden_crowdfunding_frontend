'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { projectService } from '@/lib/project-service';

type PendingProject = {
  _id?: string;
  id?: string;
  name?: string;
  summary?: string;
  status?: string;
  projectType?: string;
  type?: string;
  createdAt?: string;
  creatorId?: string;
};

export default function AdminPage() {
  const [items, setItems] = useState<PendingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reason, setReason] = useState<Record<string, string>>({});
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await projectService.adminListPending();
      const list = Array.isArray(res) ? res : (res?.projects || res?.items || []);
      setItems(list);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load pending projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    return items.map((p) => {
      const id = String(p._id || p.id || '');
      const t = p.projectType || p.type;
      return { ...p, _rowId: id, _type: t } as any;
    });
  }, [items]);

  const decide = async (id: string, finalStatus: string) => {
    try {
      setActingOn(id);
      await projectService.adminDecision(id, { finalStatus, reason: reason[id] });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Decision failed');
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Admin • Project Reviews</h1>
          <p className="text-sm text-[var(--text-muted)] font-medium">
            Pending submissions. This page is intentionally not linked anywhere.
          </p>
        </header>

        {error && (
          <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="button_primary px-5 py-3"
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">
            {rows.length} pending
          </span>
        </div>

        <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {rows.map((p: any) => (
              <div key={p._rowId} className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300">
                      {p.status || 'PENDING_REVIEW'}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-300">
                      {p._type || '—'}
                    </span>
                  </div>
                  <h2 className="text-lg font-black">{p.name || '(untitled)'}</h2>
                  <p className="text-sm text-[var(--text-muted)]">{p.summary || ''}</p>
                  {p._rowId && (
                    <Link
                      href={`/projects/${p._rowId}`}
                      className="text-sm font-bold text-[var(--primary)] hover:underline"
                    >
                      Open project
                    </Link>
                  )}
                </div>

                <div className="lg:col-span-4 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    Reason (optional)
                  </label>
                  <input
                    className="input_field"
                    value={reason[p._rowId] || ''}
                    onChange={(e) => setReason((r) => ({ ...r, [p._rowId]: e.target.value }))}
                    placeholder="Reason for approval/rejection/changes…"
                  />
                </div>

                <div className="lg:col-span-2 flex lg:flex-col gap-2 justify-end">
                  <button
                    onClick={() => decide(p._rowId, 'APPROVED')}
                    disabled={actingOn === p._rowId}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(p._rowId, 'CHANGES_REQUESTED')}
                    disabled={actingOn === p._rowId}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-60"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => decide(p._rowId, 'REJECTED')}
                    disabled={actingOn === p._rowId}
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}

            {!loading && rows.length === 0 && (
              <div className="p-10 text-center text-sm text-[var(--text-muted)] font-medium">
                No pending projects.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
