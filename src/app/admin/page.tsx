'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FolderOpen, Users, ShieldCheck, AlertTriangle,
  CheckCircle, XCircle, Clock, RefreshCw, ChevronRight,
  TrendingUp, DollarSign, Activity, Eye, BarChart3,
  Loader2, Search, Filter, MoreVertical, Flag, Star
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { projectService } from '@/lib/project-service';
import { kycAdminService } from '@/lib/kyc-admin-service';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/common/ToastProvider';

// ─── Types ────────────────────────────────────────────────────
type AdminTab = 'overview' | 'projects' | 'users' | 'kyc' | 'disputes';

interface Stats {
  totalProjects: number;
  pendingProjects: number;
  totalUsers: number;
  pendingKyc: number;
  totalInvestments: number;
  platformRevenue: number;
}

// ─── Helpers ─────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500/10 text-gray-400',
  PENDING_REVIEW: 'bg-amber-500/10 text-amber-400',
  APPROVED: 'bg-blue-500/10 text-blue-400',
  FUNDING: 'bg-emerald-500/10 text-emerald-400',
  ACTIVE: 'bg-emerald-500/10 text-emerald-400',
  FUNDED: 'bg-blue-500/10 text-blue-400',
  COMPLETED: 'bg-blue-500/10 text-blue-400',
  REJECTED: 'bg-rose-500/10 text-rose-400',
  CHANGES_REQUESTED: 'bg-orange-500/10 text-orange-400',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[status] ?? 'bg-gray-500/10 text-gray-400'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────
export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Project state
  const [projects, setProjects] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [projectStatusFilter, setProjectStatusFilter] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [actingOnProject, setActingOnProject] = useState<string | null>(null);
  const [projectReasons, setProjectReasons] = useState<Record<string, string>>({});

  // User state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // KYC state
  const [kycItems, setKycItems] = useState<any[]>([]);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [kycStatusFilter, setKycStatusFilter] = useState('');
  const [actingOnKyc, setActingOnKyc] = useState<string | null>(null);
  const [kycNotes, setKycNotes] = useState<Record<string, { reason?: string; notes?: string }>>({});

  const isAdmin = useMemo(() =>
    (user?.roles || []).some((r: string) => ['ADMIN', 'admin', 'SUPER_ADMIN'].includes(r)),
    [user]
  );

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?next=/admin');
      return;
    }
    if (!isAdmin) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  // Load data
  useEffect(() => {
    if (!isAdmin) return;
    loadProjects();
    loadUsers();
    loadKyc();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    loadProjects();
  }, [projectStatusFilter, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    loadKyc();
  }, [kycStatusFilter, isAdmin]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const params: any = {};
      if (projectStatusFilter) params.status = projectStatusFilter;
      const res = await apiClient.get('/admin/projects', { params });
      const list = Array.isArray(res.data) ? res.data : (res.data?.projects || res.data?.items || []);
      // fallback to pending endpoint if admin/projects doesn't exist
      if (list.length === 0 && !projectStatusFilter) {
        const pending = await projectService.adminListPending();
        const p = Array.isArray(pending) ? pending : (pending?.projects || pending?.items || []);
        setProjects(p);
        setAllProjects(p);
      } else {
        setProjects(list);
        setAllProjects(list);
      }
    } catch {
      try {
        const pending = await projectService.adminListPending();
        const p = Array.isArray(pending) ? pending : (pending?.projects || pending?.items || []);
        setProjects(p);
        setAllProjects(p);
      } catch { setProjects([]); }
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await apiClient.get('/users', { params: { limit: 100 } });
      const list = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.users || []);
      setUsers(list);
    } catch { setUsers([]); }
    finally { setLoadingUsers(false); }
  };

  const loadKyc = async () => {
    setLoadingKyc(true);
    try {
      const res = await kycAdminService.listProfiles({ status: kycStatusFilter || undefined, pageSize: 100 });
      setKycItems(res.items || []);
    } catch { setKycItems([]); }
    finally { setLoadingKyc(false); }
  };

  const decideProject = async (id: string, finalStatus: string) => {
    setActingOnProject(id);
    try {
      await projectService.adminDecision(id, { finalStatus, reason: projectReasons[id] });
      showSuccess(`Project ${finalStatus.replace(/_/g, ' ').toLowerCase()}`, 'Action recorded successfully');
      await loadProjects();
    } catch (e: any) {
      showError('Action failed', e?.response?.data?.message || e?.message);
    } finally { setActingOnProject(null); }
  };

  const overrideKyc = async (id: string, status: string) => {
    setActingOnKyc(id);
    try {
      await kycAdminService.overrideStatus(id, {
        status,
        rejectionReason: kycNotes[id]?.reason,
        manualNotes: kycNotes[id]?.notes,
      });
      showSuccess(`KYC ${status}`, 'Status updated');
      await loadKyc();
    } catch (e: any) {
      showError('Override failed', e?.response?.data?.message || e?.message);
    } finally { setActingOnKyc(null); }
  };

  // Derived
  const filteredProjects = useMemo(() =>
    projects.filter(p =>
      (p.name || p.title || '').toLowerCase().includes(projectSearch.toLowerCase())
    ), [projects, projectSearch]);

  const filteredUsers = useMemo(() =>
    users.filter(u =>
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase())
    ), [users, userSearch]);

  const stats: Stats = useMemo(() => ({
    totalProjects: allProjects.length,
    pendingProjects: allProjects.filter(p => p.status === 'PENDING_REVIEW').length,
    totalUsers: users.length,
    pendingKyc: kycItems.filter(k => k.status === 'PENDING' || k.status === 'UNDER_REVIEW').length,
    totalInvestments: 0,
    platformRevenue: 0,
  }), [allProjects, users, kycItems]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) return null;

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { key: 'projects', label: 'Projects', icon: <FolderOpen size={16} />, badge: stats.pendingProjects || undefined },
    { key: 'users', label: 'Users', icon: <Users size={16} />, badge: stats.totalUsers || undefined },
    { key: 'kyc', label: 'KYC', icon: <ShieldCheck size={16} />, badge: stats.pendingKyc || undefined },
    { key: 'disputes', label: 'Disputes', icon: <AlertTriangle size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)]">
      {/* Sidebar + Content layout */}
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="w-64 border-r border-[var(--border)] bg-[var(--card)] flex flex-col py-8 px-4 gap-2 shrink-0">
          <div className="px-3 mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Admin</p>
            <h1 className="text-xl font-black text-[var(--text-main)]">Control Panel</h1>
          </div>

          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center justify-between px-3 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.key
                ? 'bg-[var(--primary)] text-white shadow-lg shadow-blue-500/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--secondary)]'
                }`}
            >
              <span className="flex items-center gap-3">{tab.icon}{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[var(--primary)] text-white'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}

          <div className="mt-auto pt-6 border-t border-[var(--border)] space-y-2">
            <Link href="/admin/kyc" className="flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--secondary)] transition-all">
              <ShieldCheck size={16} /> KYC Detail View
            </Link>
            <Link href="/" className="flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--secondary)] transition-all">
              ← Back to App
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-8 overflow-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >

            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-black">Platform Overview</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Projects', value: stats.totalProjects, icon: <FolderOpen className="w-5 h-5" />, color: 'text-blue-400' },
                    { label: 'Pending Review', value: stats.pendingProjects, icon: <Clock className="w-5 h-5" />, color: 'text-amber-400' },
                    { label: 'Total Users', value: stats.totalUsers, icon: <Users className="w-5 h-5" />, color: 'text-violet-400' },
                    { label: 'Pending KYC', value: stats.pendingKyc, icon: <ShieldCheck className="w-5 h-5" />, color: 'text-emerald-400' },
                  ].map(card => (
                    <div key={card.label} className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)]">
                      <div className={`mb-3 ${card.color}`}>{card.icon}</div>
                      <p className="text-3xl font-black">{card.value}</p>
                      <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">{card.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Pending Projects */}
                <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden">
                  <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 className="font-black">Pending Project Reviews</h3>
                    <button onClick={() => setActiveTab('projects')} className="text-xs font-black text-[var(--primary)] hover:underline flex items-center gap-1">
                      View All <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {allProjects.filter(p => p.status === 'PENDING_REVIEW').slice(0, 5).map(p => (
                      <div key={p._id || p.id} className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{p.name}</p>
                          <p className="text-xs text-[var(--text-muted)] font-medium truncate">{p.summary}</p>
                        </div>
                        <StatusBadge status={p.status} />
                        <Link href={`/projects/${p._id || p.id}`} className="text-[var(--primary)] hover:opacity-70">
                          <Eye size={16} />
                        </Link>
                      </div>
                    ))}
                    {allProjects.filter(p => p.status === 'PENDING_REVIEW').length === 0 && (
                      <div className="p-8 text-center text-sm text-[var(--text-muted)] font-medium">
                        No pending reviews 🎉
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── PROJECTS ── */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h2 className="text-2xl font-black">Project Management</h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Search projects..."
                        value={projectSearch}
                        onChange={e => setProjectSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm font-medium outline-none focus:border-[var(--primary)] w-52"
                      />
                    </div>
                    <select
                      value={projectStatusFilter}
                      onChange={e => setProjectStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm font-bold outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING_REVIEW">Pending Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="ACTIVE">Active</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                    <button onClick={loadProjects} disabled={loadingProjects} className="p-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all">
                      <RefreshCw size={16} className={loadingProjects ? 'animate-spin text-[var(--primary)]' : 'text-[var(--text-muted)]'} />
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden">
                  <div className="divide-y divide-[var(--border)]">
                    {loadingProjects ? (
                      <div className="p-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                      </div>
                    ) : filteredProjects.length === 0 ? (
                      <div className="p-12 text-center text-[var(--text-muted)] font-medium">No projects found.</div>
                    ) : filteredProjects.map(p => {
                      const id = String(p._id || p.id);
                      return (
                        <div key={id} className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            {/* Info */}
                            <div className="lg:col-span-5 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <StatusBadge status={p.status} />
                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-500/10 text-slate-400">
                                  {p.projectType || p.type || '—'}
                                </span>
                              </div>
                              <h3 className="font-black text-base leading-tight">{p.name || '(untitled)'}</h3>
                              <p className="text-xs text-[var(--text-muted)] line-clamp-2">{p.summary}</p>
                              <Link href={`/projects/${id}`} className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1">
                                <Eye size={10} /> View Project
                              </Link>
                            </div>

                            {/* Reason */}
                            <div className="lg:col-span-4 space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                Reason / Notes
                              </label>
                              <textarea
                                rows={2}
                                className="input_field text-sm resize-none"
                                value={projectReasons[id] || ''}
                                onChange={e => setProjectReasons(r => ({ ...r, [id]: e.target.value }))}
                                placeholder="Optional reason (shown to creator)…"
                              />
                            </div>

                            {/* Actions */}
                            <div className="lg:col-span-3 flex flex-col gap-2">
                              {['PENDING_REVIEW', 'DRAFT', 'CHANGES_REQUESTED'].includes(p.status) && (
                                <button
                                  onClick={() => decideProject(id, 'APPROVED')}
                                  disabled={actingOnProject === id}
                                  className="py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                  <CheckCircle size={12} /> Approve
                                </button>
                              )}
                              {['PENDING_REVIEW', 'DRAFT'].includes(p.status) && (
                                <button
                                  onClick={() => decideProject(id, 'CHANGES_REQUESTED')}
                                  disabled={actingOnProject === id}
                                  className="py-2 rounded-xl bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-60"
                                >
                                  Request Changes
                                </button>
                              )}
                              {p.status !== 'REJECTED' && (
                                <button
                                  onClick={() => decideProject(id, 'REJECTED')}
                                  disabled={actingOnProject === id}
                                  className="py-2 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                  <XCircle size={12} /> Reject
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                        className="pl-9 pr-4 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm font-medium outline-none w-52"
                      />
                    </div>
                    <button onClick={loadUsers} disabled={loadingUsers} className="p-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)]">
                      <RefreshCw size={16} className={loadingUsers ? 'animate-spin text-[var(--primary)]' : 'text-[var(--text-muted)]'} />
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden">
                  {/* Header row */}
                  <div className="grid grid-cols-12 px-6 py-3 border-b border-[var(--border)] bg-[var(--secondary)]">
                    {['User', 'Email', 'Role', 'KYC', 'Joined'].map((h, i) => (
                      <div key={h} className={`text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ${i === 0 ? 'col-span-3' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-2' : i === 3 ? 'col-span-2' : 'col-span-2'}`}>
                        {h}
                      </div>
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
                        <div className="col-span-3 flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                            {(u.firstName || u.email || '?')[0].toUpperCase()}
                          </div>
                          <p className="font-bold text-sm truncate">{[u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unknown'}</p>
                        </div>
                        <div className="col-span-3 text-sm text-[var(--text-muted)] font-medium truncate">{u.email}</div>
                        <div className="col-span-2">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
                            {(u.roles || [u.role || 'USER'])[0]}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${u.kycStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : u.kycStatus === 'PENDING' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'}`}>
                            {u.kycStatus || 'NONE'}
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

            {/* ── KYC ── */}
            {activeTab === 'kyc' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h2 className="text-2xl font-black">KYC Moderation</h2>
                  <div className="flex items-center gap-3">
                    <select
                      value={kycStatusFilter}
                      onChange={e => setKycStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm font-bold outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="NEEDS_MORE_INFO">Needs More Info</option>
                    </select>
                    <button onClick={loadKyc} disabled={loadingKyc} className="p-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)]">
                      <RefreshCw size={16} className={loadingKyc ? 'animate-spin text-[var(--primary)]' : 'text-[var(--text-muted)]'} />
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden">
                  <div className="divide-y divide-[var(--border)]">
                    {loadingKyc ? (
                      <div className="p-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                      </div>
                    ) : kycItems.length === 0 ? (
                      <div className="p-12 text-center text-[var(--text-muted)] font-medium">No KYC profiles.</div>
                    ) : kycItems.map((k: any) => (
                      <div key={k.id} className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-4 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge status={k.status} />
                            <span className="text-[10px] font-black text-[var(--text-muted)]">{k.documentCount} docs</span>
                          </div>
                          <p className="text-sm font-bold truncate">Profile: {k.id?.slice(-8)}</p>
                          <p className="text-xs text-[var(--text-muted)]">User: {k.userId?.slice(-8)}</p>
                          {k.rejectionReason && <p className="text-xs text-rose-400 font-medium">{k.rejectionReason}</p>}
                        </div>

                        <div className="lg:col-span-5 space-y-2">
                          <input
                            className="input_field text-sm"
                            placeholder="Rejection reason (optional)"
                            value={kycNotes[k.id]?.reason || ''}
                            onChange={e => setKycNotes(n => ({ ...n, [k.id]: { ...n[k.id], reason: e.target.value } }))}
                          />
                          <input
                            className="input_field text-sm"
                            placeholder="Internal notes"
                            value={kycNotes[k.id]?.notes || ''}
                            onChange={e => setKycNotes(n => ({ ...n, [k.id]: { ...n[k.id], notes: e.target.value } }))}
                          />
                        </div>

                        <div className="lg:col-span-3 flex flex-col gap-2">
                          <button
                            onClick={() => overrideKyc(k.id, 'APPROVED')}
                            disabled={actingOnKyc === k.id}
                            className="py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => overrideKyc(k.id, 'NEEDS_MORE_INFO')}
                            disabled={actingOnKyc === k.id}
                            className="py-2 rounded-xl bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-60"
                          >
                            More Info
                          </button>
                          <button
                            onClick={() => overrideKyc(k.id, 'REJECTED')}
                            disabled={actingOnKyc === k.id}
                            className="py-2 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── DISPUTES ── */}
            {activeTab === 'disputes' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black">Dispute Resolution</h2>
                <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                  </div>
                  <h3 className="font-black text-lg">Dispute System</h3>
                  <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto font-medium">
                    No active disputes at this time. When investors or creators raise disputes, they will appear here for arbitration.
                  </p>
                </div>
              </div>
            )}

          </motion.div>
        </main>
      </div>
    </div>
  );
}
