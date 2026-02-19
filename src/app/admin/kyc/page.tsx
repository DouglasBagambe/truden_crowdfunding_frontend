'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { kycAdminService, type KycAdminListItem } from '@/lib/kyc-admin-service';

export default function AdminKycPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [items, setItems] = useState<KycAdminListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [notes, setNotes] = useState<Record<string, { rejectionReason?: string; manualNotes?: string }>>({});

  const isAdmin = (user?.roles || []).includes('ADMIN');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await kycAdminService.listProfiles({ status: statusFilter || undefined });
      setItems(res.items || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load KYC profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?next=/admin/kyc');
      return;
    }
    if (!isAdmin) {
      setError('Access denied');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, isAdmin, statusFilter]);

  const rows = useMemo(() => {
    return (items || []).map((p) => ({ ...p, _id: p.id }));
  }, [items]);

  const override = async (id: string, status: string) => {
    try {
      setActingOn(id);
      const payload = {
        status,
        rejectionReason: notes[id]?.rejectionReason,
        manualNotes: notes[id]?.manualNotes,
      };
      await kycAdminService.overrideStatus(id, payload);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Override failed');
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Admin • KYC Moderation</h1>
          <p className="text-sm text-[var(--text-muted)] font-medium">
            Review and override KYC profiles.
          </p>
          <div className="text-xs font-bold">
            <Link className="text-[var(--primary)] hover:underline" href="/admin">← Project Reviews</Link>
          </div>
        </header>

        {error && (
          <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={load}
            className="button_primary px-5 py-3"
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Status</span>
            <select
              className="input_field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="UNVERIFIED">UNVERIFIED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="PENDING">PENDING</option>
              <option value="SUBMITTED_TO_PROVIDER">SUBMITTED_TO_PROVIDER</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="NEEDS_MORE_INFO">NEEDS_MORE_INFO</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>

          <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">
            {rows.length} profiles
          </span>
        </div>

        <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {rows.map((p: any) => (
              <div key={p._id} className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300">
                      {p.status}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-300">
                      userKyc: {p.userKycStatus}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-300">
                      docs: {p.documentCount}
                    </span>
                  </div>

                  <p className="text-sm font-black break-words">Profile: {p.id}</p>
                  <p className="text-xs text-[var(--text-muted)] font-semibold break-words">User: {p.userId}</p>
                  {p.rejectionReason && (
                    <p className="text-xs text-rose-300 font-bold break-words">Reason: {p.rejectionReason}</p>
                  )}
                </div>

                <div className="lg:col-span-5 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    Notes
                  </label>
                  <input
                    className="input_field"
                    placeholder="Rejection reason (optional)"
                    value={notes[p._id]?.rejectionReason || ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [p._id]: { ...n[p._id], rejectionReason: e.target.value } }))}
                  />
                  <input
                    className="input_field"
                    placeholder="Internal notes (optional)"
                    value={notes[p._id]?.manualNotes || ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [p._id]: { ...n[p._id], manualNotes: e.target.value } }))}
                  />
                </div>

                <div className="lg:col-span-2 flex lg:flex-col gap-2 justify-end">
                  <button
                    onClick={() => override(p._id, 'APPROVED')}
                    disabled={actingOn === p._id}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => override(p._id, 'NEEDS_MORE_INFO')}
                    disabled={actingOn === p._id}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-60"
                  >
                    More Info
                  </button>
                  <button
                    onClick={() => override(p._id, 'REJECTED')}
                    disabled={actingOn === p._id}
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}

            {!loading && rows.length === 0 && (
              <div className="p-10 text-center text-sm text-[var(--text-muted)] font-medium">
                No profiles.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
