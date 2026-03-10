'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FolderOpen, Users, ShieldCheck, CheckCircle,
  XCircle, Clock, RefreshCw, ChevronRight, Eye, Loader2,
  Search, AlertTriangle, Bell, TrendingUp, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { projectService } from '@/lib/project-service';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID || '';

type AdminTab = 'overview' | 'projects' | 'users';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  PENDING_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  APPROVED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  FUNDING: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  FUNDED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  CHANGES_REQUESTED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)] space-y-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">{label}</p>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Data
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Actions
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  // Admin check: match user ID against env NEXT_PUBLIC_ADMIN_USER_ID
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const uid = user.id || user._id || '';
    // Also allow role-based admin
    const hasAdminRole = (user.roles || []).some((r: string) =>
      ['ADMIN', 'admin', 'SUPER_ADMIN'].includes(r)
    );
    return (ADMIN_USER_ID && uid === ADMIN_USER_ID) || hasAdminRole;
  }, [user]);

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login?next=/admin'); return; }
    if (!isAdmin && !authLoading) {
      // Give a moment for user to load
      const t = setTimeout(() => {
        if (!isAdmin) router.push('/');
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) { loadProjects(); loadUsers(); }
  }, [isAdmin]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const data = await projectService.adminListAll();
      const list = Array.isArray(data) ? data : (data?.projects || data?.items || []);
      setAllProjects(list);
    } catch {
      // fallback to pending
      try {
        const data = await projectService.adminListPending();
        setAllProjects(Array.isArray(data) ? data : []);
      } catch { setAllProjects([]); }
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await apiClient.get('/users', { params: { limit: 200 } });
      const list = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.users || []);
      setUsers(list);
    } catch { setUsers([]); }
    finally { setLoadingUsers(false); }
  };

  const decide = async (id: string, finalStatus: string) => {
    if (finalStatus === 'REJECTED' && !reasons[id]?.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    setActingOn(id);
    const tid = toast.loading(`Processing...`);
    try {
      await projectService.adminDecision(id, { finalStatus, reason: reasons[id] });
      toast.success(`Project ${finalStatus.replace(/_/g, ' ').toLowerCase()}`, { id: tid });
      await loadProjects();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Action failed', { id: tid });
    } finally { setActingOn(null); }
  };

  // Derived
  const filteredProjects = useMemo(() => {
    let list = allProjects;
    if (statusFilter) list = list.filter(p => p.status === statusFilter);
    if (projectSearch) list = list.filter(p =>
      (p.name || '').toLowerCase().includes(projectSearch.toLowerCase()) ||
      (p.summary || '').toLowerCase().includes(projectSearch.toLowerCase())
    );
    return list;
  }, [allProjects, statusFilter, projectSearch]);

  const filteredUsers = useMemo(() =>
    users.filter(u =>
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase())
    ), [users, userSearch]);

  const pendingCount = allProjects.filter(p => p.status === 'PENDING_REVIEW').length;
  const approvedCount = allProjects.filter(p => ['APPROVED', 'FUNDING', 'FUNDED'].includes(p.status)).length;
  const rejectedCount = allProjects.filter(p => p.status === 'REJECTED').length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center space-y-4">
        <ShieldCheck className="w-16 h-16 text-[var(--text-muted)] mx-auto opacity-30" />
        <p className="text-[var(--text-muted)] font-medium">Access restricted</p>
        <Link href="/" className="text-sm font-bold text-[var(--primary)] hover:underline">← Back home</Link>
      </div>
    </div>
  );

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { key: 'projects', label: 'Campaigns', icon: <FolderOpen size={16} />, badge: pendingCount || undefined },
    { key: 'users', label: 'Users', icon: <Users size={16} />, badge: users.length || undefined },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)]">
      <div className="flex min-h-screen">

        {/* ── Sidebar ── */}
        <aside className="w-60 border-r border-[var(--border)] bg-[var(--card)] flex flex-col py-8 px-3 gap-1 shrink-0 sticky top-0 h-screen overflow-auto">
          <div className="px-3 mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Keibo</p>
            <h1 className="text-xl font-black">Admin Panel</h1>
          </div>

          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--secondary)]'
                }`}
            >
              <span className="flex items-center gap-3">{tab.icon}{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-amber-500 text-white'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}

          <div className="mt-auto pt-6 border-t border-[var(--border)] space-y-1">
            <Link href="/" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--secondary)] transition-all">
              <ArrowLeft size={16} /> Back to App
            </Link>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 p-8 overflow-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >

            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-black">Platform Overview</h2>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Campaigns" value={allProjects.length} icon={<FolderOpen size={18} />} color="bg-blue-500/10 text-blue-400" />
                  <StatCard label="Pending Review" value={pendingCount} icon={<Clock size={18} />} color="bg-amber-500/10 text-amber-400" />
                  <StatCard label="Approved / Live" value={approvedCount} icon={<CheckCircle size={18} />} color="bg-emerald-500/10 text-emerald-400" />
                  <StatCard label="Total Users" value={users.length} icon={<Users size={18} />} color="bg-violet-500/10 text-violet-400" />
                </div>

                {/* Pending campaigns quick list */}
                <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden">
                  <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 className="font-black flex items-center gap-2">
                      <Bell size={16} className="text-amber-400" /> Awaiting Review ({pendingCount})
                    </h3>
                    <button onClick={() => setActiveTab('projects')} className="text-xs font-black text-[var(--primary)] hover:underline flex items-center gap-1">
                      Manage All <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {allProjects.filter(p => p.status === 'PENDING_REVIEW').slice(0, 6).map(p => {
                      const creator = p.creator || p.creatorId;
                      const creatorName = creator && typeof creator === 'object'
                        ? [creator.firstName, creator.lastName].filter(Boolean).join(' ') || creator.email
                        : 'Unknown';
                      return (
                        <div key={p._id || p.id} className="p-4 flex items-center gap-4 hover:bg-[var(--secondary)] transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{p.name}</p>
                            <p className="text-xs text-[var(--text-muted)] truncate">by {creatorName} · {p.category || p.projectType}</p>
                          </div>
                          <StatusBadge status={p.status} />
                          <Link href={`/projects/${p._id || p.id}`} target="_blank" className="text-[var(--primary)] hover:opacity-70 flex-shrink-0">
                            <Eye size={15} />
                          </Link>
                        </div>
                      );
                    })}
                    {pendingCount === 0 && (
                      <div className="p-10 text-center text-sm text-[var(--text-muted)] font-medium">
                        All caught up — no pending reviews.
                      </div>
                    )}
                  </div>
                </div>

                {/* Status breakdown */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Draft', count: allProjects.filter(p => p.status === 'DRAFT').length, color: 'text-gray-400' },
                    { label: 'Pending', count: pendingCount, color: 'text-amber-400' },
                    { label: 'Approved', count: approvedCount, color: 'text-emerald-400' },
                    { label: 'Rejected', count: rejectedCount, color: 'text-rose-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-center">
                      <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── CAMPAIGNS / PROJECTS ── */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h2 className="text-2xl font-black">Campaign Management</h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={projectSearch}
                        onChange={e => setProjectSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm font-medium outline-none focus:border-[var(--primary)] w-48"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm font-bold outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING_REVIEW">Pending Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="FUNDING">Funding</option>
                      <option value="CHANGES_REQUESTED">Changes Requested</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                    <button
                      onClick={loadProjects}
                      disabled={loadingProjects}
                      className="p-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all"
                    >
                      <RefreshCw size={16} className={loadingProjects ? 'animate-spin text-[var(--primary)]' : 'text-[var(--text-muted)]'} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {loadingProjects ? (
                    <div className="py-20 flex items-center justify-center bg-[var(--card)] rounded-3xl border border-[var(--border)]">
                      <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                    </div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="py-20 text-center bg-[var(--card)] rounded-3xl border border-[var(--border)] text-[var(--text-muted)] font-medium">
                      No campaigns found.
                    </div>
                  ) : filteredProjects.map(p => {
                    const id = String(p._id || p.id);
                    const creator = p.creator || p.creatorId;
                    const creatorName = creator && typeof creator === 'object'
                      ? [creator.firstName, creator.lastName].filter(Boolean).join(' ') || creator.email
                      : 'Unknown Creator';
                    const raised = p.raisedAmount || p.progress?.raisedAmount || 0;
                    const target = p.targetAmount || p.goalAmount || 0;
                    const pct = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
                    const isPending = p.status === 'PENDING_REVIEW' || p.status === 'CHANGES_REQUESTED' || p.status === 'DRAFT';
                    const isActing = actingOn === id;

                    return (
                      <div key={id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--primary)]/30 transition-all">
                        {/* Top bar */}
                        <div className="p-5 border-b border-[var(--border)] flex items-center gap-3 flex-wrap">
                          <StatusBadge status={p.status} />
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-500/10 text-slate-400">
                            {p.projectType || p.type || 'CHARITY'}
                          </span>
                          {p.category && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-[var(--secondary)] text-[var(--text-muted)]">
                              {p.category}
                            </span>
                          )}
                          <div className="ml-auto flex items-center gap-2">
                            <Link
                              href={`/projects/${id}`}
                              target="_blank"
                              className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
                            >
                              <Eye size={12} /> Preview
                            </Link>
                          </div>
                        </div>

                        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                          {/* Project info */}
                          <div className="lg:col-span-4 space-y-2">
                            <h3 className="font-black text-base leading-tight">{p.name || '(Untitled)'}</h3>
                            <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">{p.summary}</p>
                            <div className="flex items-center gap-2 pt-1">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-[10px] font-black">
                                  {(creatorName[0] || '?').toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-[var(--text-muted)]">{creatorName}</p>
                            </div>
                            {/* Funding progress (if any) */}
                            {target > 0 && (
                              <div className="space-y-1 pt-1">
                                <div className="w-full h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <p className="text-[10px] text-[var(--text-muted)] font-medium">
                                  {p.currency || 'UGX'} {raised.toLocaleString()} raised of {target.toLocaleString()} ({pct.toFixed(0)}%)
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Reason textarea */}
                          <div className="lg:col-span-5 space-y-2 flex flex-col">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                              Reason / Feedback <span className="text-rose-400">{p.status !== 'APPROVED' ? '(required for rejection)' : ''}</span>
                            </label>
                            <textarea
                              rows={4}
                              className="input_field text-sm resize-none flex-1"
                              value={reasons[id] || ''}
                              onChange={e => setReasons(r => ({ ...r, [id]: e.target.value }))}
                              placeholder="Provide feedback to the campaign creator (shown in email notification)..."
                            />
                            {p.decisionReason && (
                              <p className="text-xs text-amber-400 font-medium">
                                Previous reason: {p.decisionReason}
                              </p>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="lg:col-span-3 flex flex-col gap-2 justify-start">
                            {isPending && (
                              <button
                                onClick={() => decide(id, 'APPROVED')}
                                disabled={isActing}
                                className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
                              >
                                {isActing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                Approve
                              </button>
                            )}
                            {isPending && (
                              <button
                                onClick={() => decide(id, 'CHANGES_REQUESTED')}
                                disabled={isActing}
                                className="py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60 transition-all"
                              >
                                Request Changes
                              </button>
                            )}
                            {p.status !== 'REJECTED' && p.status !== 'APPROVED' && (
                              <button
                                onClick={() => decide(id, 'REJECTED')}
                                disabled={isActing}
                                className="py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
                              >
                                {isActing ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                Reject
                              </button>
                            )}
                            {p.status === 'APPROVED' && (
                              <button
                                onClick={() => decide(id, 'REJECTED')}
                                disabled={isActing}
                                className="py-3 rounded-xl border border-rose-500/30 text-rose-400 text-[10px] font-black uppercase tracking-widest disabled:opacity-60 hover:bg-rose-500/10 transition-all"
                              >
                                Revoke
                              </button>
                            )}
                            {p.status === 'REJECTED' && (
                              <button
                                onClick={() => decide(id, 'APPROVED')}
                                disabled={isActing}
                                className="py-3 rounded-xl border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest disabled:opacity-60 hover:bg-emerald-500/10 transition-all"
                              >
                                Re-Approve
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h2 className="text-2xl font-black">User Management</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm outline-none focus:border-[var(--primary)] w-52"
                      />
                    </div>
                    <button onClick={loadUsers} disabled={loadingUsers} className="p-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)]">
                      <RefreshCw size={16} className={loadingUsers ? 'animate-spin text-[var(--primary)]' : 'text-[var(--text-muted)]'} />
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden">
                  <div className="grid grid-cols-12 px-6 py-3 border-b border-[var(--border)] bg-[var(--secondary)]">
                    {[['User', 'col-span-4'], ['Email', 'col-span-4'], ['Role', 'col-span-2'], ['Joined', 'col-span-2']].map(([h, cls]) => (
                      <div key={h} className={`text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ${cls}`}>{h}</div>
                    ))}
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {loadingUsers ? (
                      <div className="p-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-12 text-center text-[var(--text-muted)] font-medium">No users found.</div>
                    ) : filteredUsers.map((u: any) => (
                      <div key={u.id || u._id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-[var(--secondary)] transition-colors">
                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                            {(u.firstName || u.email || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{[u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unknown'}</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-medium">
                              {u.emailVerifiedAt ? '✓ Verified' : 'Unverified'}
                            </p>
                          </div>
                        </div>
                        <div className="col-span-4 text-sm text-[var(--text-muted)] font-medium truncate pr-4">{u.email}</div>
                        <div className="col-span-2">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400">
                            {(u.roles || [u.role || 'USER'])[0]}
                          </span>
                        </div>
                        <div className="col-span-2 text-xs text-[var(--text-muted)] font-medium">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </main>
      </div>
    </div>
  );
}
