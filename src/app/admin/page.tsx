'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FolderOpen, Users, ShieldCheck, CheckCircle,
  XCircle, Clock, RefreshCw, ChevronRight, Eye, Loader2,
  Search, Bell, ArrowLeft, Ban, UserCheck, RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { projectService } from '@/lib/project-service';
import { apiClient } from '@/lib/api-client';
import { kycAdminService, type KycAdminListItem } from '@/lib/kyc-admin-service';
import toast from 'react-hot-toast';

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID || '';

type AdminTab = 'overview' | 'projects' | 'kyc' | 'users' | 'payouts';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'chip-neutral',
  PENDING_REVIEW: 'chip-warning',
  APPROVED: 'chip-success',
  FUNDING: 'chip-success',
  FUNDED: 'chip-info',
  COMPLETED: 'chip-info',
  REJECTED: 'chip-danger',
  CHANGES_REQUESTED: 'chip-warning',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`chip-base chip-compact ${STATUS_COLORS[status] ?? 'chip-neutral'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: { dot: string; iconBox: string };
}) {
  return (
    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-start justify-between gap-4">
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${tone.iconBox}`}>
          {icon}
        </div>
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${tone.dot}`} />
      </div>
      <div className="mt-6 space-y-1.5">
        <p className="text-[11px] text-[var(--text-muted)] font-black uppercase tracking-[0.18em]">{label}</p>
        <p className="text-3xl font-black text-[var(--text-main)] tracking-tight">{value}</p>
      </div>
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
  const [kycProfiles, setKycProfiles] = useState<KycAdminListItem[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [kycTotal, setKycTotal] = useState(0);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [loadingPayouts, setLoadingPayouts] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [kycStatusFilter, setKycStatusFilter] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Actions
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  // Admin check
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const uid = user.id || user._id || '';
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
      const t = setTimeout(() => { if (!isAdmin) router.push('/'); }, 1500);
      return () => clearTimeout(t);
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) { loadProjects(); loadUsers(); loadKycProfiles(); loadPayouts(); }
  }, [isAdmin]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const data = await projectService.adminListAll();
      const list = Array.isArray(data) ? data : (data?.projects || data?.items || []);
      setAllProjects(list);
    } catch {
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
      // Use the new /admin/users endpoint which has no role restriction
      const res = await apiClient.get('/admin/users', { params: { limit: 200 } });
      const data = res.data;
      const list = Array.isArray(data) ? data : (data?.users || data?.items || []);
      setUsers(list);
    } catch { setUsers([]); }
    finally { setLoadingUsers(false); }
  };

  const loadKycProfiles = async (status?: string) => {
    setLoadingKyc(true);
    try {
      const res = await kycAdminService.listProfiles({ status: status || kycStatusFilter || undefined, pageSize: 50 });
      setKycProfiles(res.items);
      setKycTotal(res.total);
    } catch { setKycProfiles([]); }
    finally { setLoadingKyc(false); }
  };

  const loadPayouts = async () => {
    setLoadingPayouts(true);
    try {
      const res = await apiClient.get('/wallet/admin/withdrawals/pending');
      setPayouts(res.data);
    } catch { setPayouts([]); }
    finally { setLoadingPayouts(false); }
  };

  const overrideKycStatus = async (profileId: string, status: string, reason?: string) => {
    const tid = toast.loading(status === 'APPROVED' ? 'Approving KYC...' : 'Rejecting KYC...');
    try {
      await kycAdminService.overrideStatus(profileId, { status, rejectionReason: reason });
      toast.success(`KYC ${status.toLowerCase()}`, { id: tid });
      await loadKycProfiles();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Action failed', { id: tid });
    }
  };

  // Project decision (approve / reject / changes-requested / revoke / re-approve)
  const decide = async (id: string, finalStatus: string) => {
    if (finalStatus === 'REJECTED' && !reasons[id]?.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    setActingOn(id);
    const tid = toast.loading('Processing...');
    try {
      await projectService.adminDecision(id, { finalStatus, reason: reasons[id] });
      toast.success(`Project ${finalStatus.replace(/_/g, ' ').toLowerCase()}`, { id: tid });
      await loadProjects();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Action failed', { id: tid });
    } finally { setActingOn(null); }
  };

  // Block / unblock user
  const toggleBlock = async (userId: string, isBlocked: boolean) => {
    setActingOn(userId);
    const tid = toast.loading(isBlocked ? 'Unblocking user...' : 'Blocking user...');
    try {
      await apiClient.patch(`/admin/users/${userId}/block`, { isBlocked: !isBlocked });
      toast.success(isBlocked ? 'User unblocked' : 'User blocked', { id: tid });
      await loadUsers();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Action failed', { id: tid });
    } finally { setActingOn(null); }
  };

  // Change user role
  const changeRole = async (userId: string, role: string) => {
    setActingOn(userId);
    const tid = toast.loading('Updating role...');
    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role });
      toast.success(`Role updated to ${role}`, { id: tid });
      await loadUsers();
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
      `${u.firstName || u.profile?.firstName || ''} ${u.lastName || u.profile?.lastName || ''}`.toLowerCase().includes(userSearch.toLowerCase())
    ), [users, userSearch]);

  const pendingCount = allProjects.filter(p => p.status === 'PENDING_REVIEW').length;
  const pendingKycCount = kycProfiles.filter(p => p.status === 'PENDING' || p.status === 'UNDER_REVIEW').length;
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
    { key: 'kyc', label: 'KYC Review', icon: <ShieldCheck size={16} />, badge: pendingKycCount || undefined },
    { key: 'users', label: 'Users', icon: <Users size={16} />, badge: users.length || undefined },
    { key: 'payouts', label: 'Payouts', icon: <RotateCcw size={16} />, badge: payouts.length || undefined },
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--text-muted)]">Operations</p>
                    <h2 className="text-2xl font-black tracking-tight">Platform Overview</h2>
                    <p className="text-sm text-[var(--text-muted)]">Monitor campaign moderation, user verification, and payout workload from one place.</p>
                  </div>
                  <button
                    onClick={() => { loadProjects(); loadUsers(); loadKycProfiles(); loadPayouts(); }}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold text-[var(--text-main)] hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <RefreshCw size={15} className="text-[var(--text-muted)]" />
                    Refresh data
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <StatCard
                    label="Total Campaigns"
                    value={allProjects.length}
                    icon={<FolderOpen size={18} />}
                    tone={{
                      dot: 'bg-blue-600',
                      iconBox: 'bg-slate-50 border-slate-200 text-blue-700 dark:bg-slate-900/30 dark:border-slate-800 dark:text-blue-300',
                    }}
                  />
                  <StatCard
                    label="Pending Review"
                    value={pendingCount}
                    icon={<Clock size={18} />}
                    tone={{
                      dot: 'bg-amber-500',
                      iconBox: 'bg-slate-50 border-slate-200 text-amber-700 dark:bg-slate-900/30 dark:border-slate-800 dark:text-amber-300',
                    }}
                  />
                  <StatCard
                    label="Approved / Live"
                    value={approvedCount}
                    icon={<CheckCircle size={18} />}
                    tone={{
                      dot: 'bg-emerald-600',
                      iconBox: 'bg-slate-50 border-slate-200 text-emerald-700 dark:bg-slate-900/30 dark:border-slate-800 dark:text-emerald-300',
                    }}
                  />
                  <StatCard
                    label="Total Users"
                    value={users.length}
                    icon={<Users size={18} />}
                    tone={{
                      dot: 'bg-violet-600',
                      iconBox: 'bg-slate-50 border-slate-200 text-violet-700 dark:bg-slate-900/30 dark:border-slate-800 dark:text-violet-300',
                    }}
                  />
                  <StatCard
                    label="Pending Payouts"
                    value={payouts.length}
                    icon={<RotateCcw size={18} />}
                    tone={{
                      dot: 'bg-rose-600',
                      iconBox: 'bg-slate-50 border-slate-200 text-rose-700 dark:bg-slate-900/30 dark:border-slate-800 dark:text-rose-300',
                    }}
                  />
                </div>

                {/* Pending campaigns quick list */}
                <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 flex items-center justify-center">
                        <Bell size={16} className="text-amber-700 dark:text-amber-300" />
                      </div>
                      <div>
                        <h3 className="font-black">Awaiting Review</h3>
                        <p className="text-xs text-[var(--text-muted)] font-medium">{pendingCount} campaign{pendingCount === 1 ? '' : 's'} currently need moderation.</p>
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('projects')} className="text-xs font-black text-[var(--primary)] hover:underline flex items-center gap-1">
                      Manage All <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {allProjects.filter(p => p.status === 'PENDING_REVIEW').slice(0, 6).map(p => {
                      const creator = p.creator || p.creatorId;
                      const creatorName = creator && typeof creator === 'object'
                        ? [creator.profile?.firstName || creator.firstName, creator.profile?.lastName || creator.lastName].filter(Boolean).join(' ') || creator.email
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
                      <div className="p-12 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30">
                          <CheckCircle size={18} className="text-emerald-700 dark:text-emerald-300" />
                        </div>
                        <p className="text-sm font-semibold text-[var(--text-main)]">No campaigns awaiting action</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">The moderation queue is clear right now.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status breakdown */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      label: 'Draft',
                      count: allProjects.filter(p => p.status === 'DRAFT').length,
                      dot: 'bg-slate-400',
                    },
                    {
                      label: 'Pending',
                      count: pendingCount,
                      dot: 'bg-amber-500',
                    },
                    {
                      label: 'Approved',
                      count: approvedCount,
                      dot: 'bg-emerald-500',
                    },
                    {
                      label: 'Rejected',
                      count: rejectedCount,
                      dot: 'bg-rose-500',
                    },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className={`h-3 w-3 rounded-full ${s.dot}`} />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">{s.label}</p>
                          <p className="mt-1 text-2xl font-black text-[var(--text-main)]">{s.count}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── CAMPAIGNS / PROJECTS ── */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-black">Campaign Management</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Approve, reject, or request changes for submitted campaigns. Rejected campaigns are hidden from the public.</p>
                  </div>
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
                      ? [creator.profile?.firstName || creator.firstName, creator.profile?.lastName || creator.lastName].filter(Boolean).join(' ') || creator.email
                      : 'Unknown Creator';
                    const raised = p.raisedAmount || p.progress?.raisedAmount || 0;
                    const target = p.targetAmount || p.goalAmount || 0;
                    const pct = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
                    const isActing = actingOn === id;
                    const status = p.status as string;

                    // Determine which action buttons to show based on current status
                    const canApprove = ['PENDING_REVIEW', 'CHANGES_REQUESTED', 'DRAFT', 'REJECTED'].includes(status);
                    const canRequestChanges = ['PENDING_REVIEW', 'APPROVED', 'DRAFT'].includes(status);
                    const canReject = !['REJECTED'].includes(status);
                    const canRevoke = status === 'APPROVED' || status === 'FUNDING';

                    return (
                      <div key={id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--primary)]/30 transition-all">
                        {/* Top bar */}
                        <div className="p-5 border-b border-[var(--border)] flex items-center gap-3 flex-wrap">
                          <StatusBadge status={p.status} />
                          <span
                            className={`chip-base chip-compact ${(p.projectType || p.type) === 'ROI' ? 'chip-info' : 'chip-success'}`}
                          >
                            {p.projectType || p.type || 'CHARITY'}
                          </span>
                          {p.category && (
                            <span className="chip-base chip-compact chip-neutral">
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
                            {p.decisionReason && (
                              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium bg-amber-50 dark:bg-amber-950/20 rounded-lg px-2 py-1 border border-amber-200 dark:border-amber-900/30">
                                Previous note: {p.decisionReason}
                              </p>
                            )}
                          </div>

                          {/* Reason textarea */}
                          <div className="lg:col-span-5 space-y-2 flex flex-col">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                              Admin Note / Feedback <span className="text-rose-400">(required for rejection)</span>
                            </label>
                            <textarea
                              rows={4}
                              className="input_field text-sm resize-none flex-1"
                              value={reasons[id] || ''}
                              onChange={e => setReasons(r => ({ ...r, [id]: e.target.value }))}
                              placeholder="Provide feedback to the campaign creator (shown in email notification)..."
                            />
                          </div>

                          {/* Action buttons */}
                          <div className="lg:col-span-3 flex flex-col gap-2 justify-start">
                            {canApprove && (
                              <button
                                onClick={() => decide(id, 'APPROVED')}
                                disabled={isActing}
                                className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
                              >
                                {isActing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                Approve
                              </button>
                            )}
                            {canRequestChanges && (
                              <button
                                onClick={() => decide(id, 'CHANGES_REQUESTED')}
                                disabled={isActing}
                                className="py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60 transition-all"
                              >
                                Request Changes
                              </button>
                            )}
                            {canRevoke && (
                              <button
                                onClick={() => decide(id, 'REJECTED')}
                                disabled={isActing}
                                className="py-3 rounded-xl border border-rose-300 text-rose-700 dark:border-rose-900/40 dark:text-rose-300 text-[10px] font-black uppercase tracking-widest disabled:opacity-60 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center gap-2"
                              >
                                {isActing ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                Revoke
                              </button>
                            )}
                            {canReject && !canRevoke && (
                              <button
                                onClick={() => decide(id, 'REJECTED')}
                                disabled={isActing}
                                className="py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
                              >
                                {isActing ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                Reject
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

            {/* ── KYC REVIEW ── */}
            {activeTab === 'kyc' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-black">KYC Review</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Review and approve/reject identity verifications submitted by users.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={kycStatusFilter}
                      onChange={e => { setKycStatusFilter(e.target.value); loadKycProfiles(e.target.value); }}
                      className="px-3 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm font-bold outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                    <button onClick={() => loadKycProfiles()} disabled={loadingKyc}
                      className="p-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all">
                      <RefreshCw size={16} className={loadingKyc ? 'animate-spin text-[var(--primary)]' : 'text-[var(--text-muted)]'} />
                    </button>
                  </div>
                </div>

                {loadingKyc ? (
                  <div className="py-20 flex items-center justify-center bg-[var(--card)] rounded-3xl border border-[var(--border)]">
                    <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                  </div>
                ) : kycProfiles.length === 0 ? (
                  <div className="py-20 text-center bg-[var(--card)] rounded-3xl border border-[var(--border)] text-[var(--text-muted)] font-medium">
                    No KYC submissions found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {kycProfiles.map(kyc => {
                      const statusColors: Record<string, string> = {
                        APPROVED: 'chip-success',
                        PENDING: 'chip-warning',
                        UNDER_REVIEW: 'chip-warning',
                        REJECTED: 'chip-danger',
                        EXPIRED: 'chip-warning',
                      };
                      const sc = statusColors[kyc.status] ?? 'chip-neutral';
                      const isPending = kyc.status === 'PENDING' || kyc.status === 'UNDER_REVIEW';
                      return (
                        <div key={kyc.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 flex-wrap hover:border-[var(--primary)]/30 transition-all">
                          <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center flex-shrink-0">
                            <ShieldCheck size={18} className="text-[var(--text-muted)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-sm">{kyc.userName || `User ${kyc.userId.slice(-8)}`}</p>
                            <p className="text-xs text-[var(--text-muted)] font-medium">
                              {kyc.userEmail ? `${kyc.userEmail} · ` : ''}{kyc.documentCount} document(s) · Submitted {kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleDateString() : '—'}
                            </p>
                          </div>
                          <span className={`chip-base chip-compact ${sc}`}>
                            {kyc.status}
                          </span>
                          {isPending && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => overrideKycStatus(kyc.id, 'APPROVED')}
                                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Rejection reason (shown to user):');
                                  if (reason !== null) overrideKycStatus(kyc.id, 'REJECTED', reason);
                                }}
                                className="chip-base chip-compact chip-danger rounded-xl hover:brightness-95 transition-all"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── USERS ── */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-black">User Management</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Block/unblock users and change their roles.</p>
                  </div>
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
                    <button onClick={loadUsers} disabled={loadingUsers} className="p-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all">
                      <RefreshCw size={16} className={loadingUsers ? 'animate-spin text-[var(--primary)]' : 'text-[var(--text-muted)]'} />
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden">
                  <div className="hidden lg:grid grid-cols-12 px-6 py-3 border-b border-[var(--border)] bg-[var(--secondary)]">
                    {[['User', 'col-span-3'], ['Email', 'col-span-3'], ['KYC', 'col-span-2'], ['Role', 'col-span-2'], ['Actions', 'col-span-2']].map(([h, cls]) => (
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
                    ) : filteredUsers.map((u: any) => {
                      const uid = u.id || u._id;
                      const firstName = u.firstName || u.profile?.firstName || '';
                      const lastName = u.lastName || u.profile?.lastName || '';
                      const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
                      const role = (u.roles || [u.role || 'INVESTOR'])[0];
                      const isBlocked = u.isBlocked;
                      const isActingUser = actingOn === uid;
                      const isCurrentAdmin = uid === (user?.id || user?._id);

                      return (
                        <div key={uid} className={`px-6 py-4 hover:bg-[var(--secondary)] transition-colors ${isBlocked ? 'opacity-60' : ''}`}>
                          {/* Mobile layout */}
                          <div className="lg:hidden space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                                {(firstName || u.email || '?')[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm">{displayName}</p>
                                <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                              </div>
                              <span className={`chip-base chip-compact ${isBlocked ? 'chip-danger' : 'chip-info'}`}>
                                {role}
                              </span>
                            </div>
                            {!isCurrentAdmin && (
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => toggleBlock(uid, isBlocked)}
                                  disabled={isActingUser}
                                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${isBlocked
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/30 dark:text-rose-300'}`}
                                >
                                  {isActingUser ? <Loader2 size={10} className="animate-spin" /> : isBlocked ? <UserCheck size={10} /> : <Ban size={10} />}
                                  {isBlocked ? 'Unblock' : 'Block'}
                                </button>
                                <select
                                  onChange={e => changeRole(uid, e.target.value)}
                                  defaultValue={role}
                                  disabled={isActingUser}
                                  className="flex-1 py-2 px-2 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-xs font-bold outline-none"
                                >
                                  <option value="INVESTOR">Investor</option>
                                  <option value="INNOVATOR">Innovator</option>
                                  <option value="ADMIN">Admin</option>
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Desktop layout */}
                          <div className="hidden lg:grid grid-cols-12 items-center gap-2">
                            <div className="col-span-3 flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                                {(firstName || u.email || '?')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{displayName}</p>
                                <p className="text-[10px] text-[var(--text-muted)] font-medium">
                                  {u.emailVerifiedAt ? '✓ Verified' : 'Unverified'}
                                  {isBlocked && ' · Blocked'}
                                </p>
                              </div>
                            </div>
                            <div className="col-span-3 text-sm text-[var(--text-muted)] font-medium truncate pr-4">{u.email}</div>
                            <div className="col-span-2">
                              <span className={`chip-base chip-compact ${u.kycStatus === 'VERIFIED'
                                ? 'chip-success'
                                : u.kycStatus === 'PENDING'
                                  ? 'chip-warning'
                                  : 'chip-neutral'
                                }`}>
                                {u.kycStatus || 'NOT VERIFIED'}
                              </span>
                            </div>
                            <div className="col-span-2">
                              {isCurrentAdmin ? (
                                <span className="chip-base chip-compact chip-violet">
                                  {role} (you)
                                </span>
                              ) : (
                                <select
                                  onChange={e => changeRole(uid, e.target.value)}
                                  defaultValue={role}
                                  disabled={isActingUser}
                                  className="py-1.5 px-2 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-xs font-bold outline-none cursor-pointer"
                                >
                                  <option value="INVESTOR">INVESTOR</option>
                                  <option value="INNOVATOR">INNOVATOR</option>
                                  <option value="ADMIN">ADMIN</option>
                                </select>
                              )}
                            </div>
                            <div className="col-span-2 flex gap-2">
                              {!isCurrentAdmin && (
                                <button
                                  onClick={() => toggleBlock(uid, isBlocked)}
                                  disabled={isActingUser}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isBlocked
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/30 dark:text-rose-300'
                                    }`}
                                >
                                  {isActingUser ? <Loader2 size={10} className="animate-spin" /> : isBlocked ? <UserCheck size={10} /> : <Ban size={10} />}
                                  {isBlocked ? 'Unblock' : 'Block'}
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

            {activeTab === 'payouts' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black tracking-tight">Pending ROI Payouts</h3>
                  <button onClick={loadPayouts} className="p-2 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:bg-white/5 transition-all">
                    <RefreshCw size={18} className={loadingPayouts ? "animate-spin" : ""} />
                  </button>
                </div>

                {loadingPayouts ? (
                  <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" /></div>
                ) : payouts.length === 0 ? (
                  <div className="py-20 text-center text-[var(--text-muted)] space-y-4">
                    <CheckCircle className="w-12 h-12 mx-auto text-emerald-500/30" />
                    <p>No pending ROI payouts requiring approval.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payouts.map(payout => (
                      <div key={payout._id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                              <span className="chip-base chip-compact chip-warning">ROI Withdrawal</span>
                              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Ref: {payout._id}</span>
                            </div>
                            <div>
                              <p className="font-black text-lg">{payout.projectId?.name || 'Unknown Project'}</p>
                              <p className="text-sm text-[var(--text-muted)]">Requested by: {payout.userId?.firstName} {payout.userId?.lastName} ({payout.userId?.email})</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                              <div>
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider mb-1">Amount Requested</p>
                                <p className="font-bold text-sm text-[var(--foreground)]">UGX {Math.abs(payout.amount).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider mb-1">Fee (2%)</p>
                                <p className="font-bold text-sm text-amber-700 dark:text-amber-300">UGX {(payout.metadata?.platformFee || 0).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider mb-1">Net Payout</p>
                                <p className="font-black text-lg text-emerald-700 dark:text-emerald-300">UGX {(payout.metadata?.payoutAmount || 0).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider mb-1">Destination</p>
                                <p className="text-xs text-[var(--foreground)] font-bold">{payout.metadata?.method?.provider} • {payout.metadata?.method?.accountNumber}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 min-w-[200px] justify-center">
                            <button
                              onClick={async () => {
                                const tid = toast.loading('Approving payment...');
                                try {
                                  setActingOn(payout._id);
                                  await apiClient.post(`/wallet/admin/withdrawals/${payout._id}/approve`);
                                  toast.success('Payment approved & processed successfully!', { id: tid });
                                  loadPayouts();
                                } catch (e: any) {
                                  toast.error(e?.response?.data?.message || 'Approval failed', { id: tid });
                                } finally { setActingOn(null); }
                              }}
                              disabled={actingOn === payout._id}
                              className="bg-emerald-500 text-white font-black text-xs uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                            >
                              {actingOn === payout._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Approve & Disburse
                            </button>

                            <button
                              onClick={async () => {
                                if (!confirm('Are you sure you want to REJECT and refund this payout to the user?')) return;
                                const tid = toast.loading('Rejecting payment...');
                                try {
                                  setActingOn(`reject_${payout._id}`);
                                  await apiClient.post(`/wallet/admin/withdrawals/${payout._id}/reject`);
                                  toast.success('Payment rejected & refunded', { id: tid });
                                  loadPayouts();
                                } catch (e: any) {
                                  toast.error(e?.response?.data?.message || 'Rejection failed', { id: tid });
                                } finally { setActingOn(null); }
                              }}
                              disabled={actingOn === `reject_${payout._id}`}
                              className="bg-transparent border border-rose-300 text-rose-700 dark:border-rose-900/40 dark:text-rose-300 font-bold text-xs uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center gap-2"
                            >
                              {actingOn === `reject_${payout._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              Reject & Refund
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </main>
      </div>
    </div>
  );
}
