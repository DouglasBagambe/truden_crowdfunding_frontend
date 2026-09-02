"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  ShieldCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronRight,
  Eye,
  Loader2,
  Search,
  Bell,
  ArrowLeft,
  Ban,
  UserCheck,
  RotateCcw,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { projectService } from "@/lib/project-service";
import { apiClient } from "@/lib/api-client";
import {
  kycAdminService,
  type KycAdminListItem,
} from "@/lib/kyc-admin-service";
import toast from "react-hot-toast";

type AdminTab = "overview" | "projects" | "kyc" | "users" | "payouts";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "chip-neutral",
  PENDING_REVIEW: "chip-warning",
  APPROVED: "chip-success",
  FUNDING: "chip-success",
  FUNDED: "chip-info",
  COMPLETED: "chip-info",
  REJECTED: "chip-danger",
  CHANGES_REQUESTED: "chip-warning",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`chip-base chip-compact ${STATUS_COLORS[status] ?? "chip-neutral"}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
// Deliberate design: left accent bar signals category, large number takes
// visual priority, label stays secondary. No icon boxes, no rainbow tiles.
interface KpiCardProps {
  label: string;
  value: number;
  accentClass: string; // Tailwind bg class for the left bar
  note?: string; // optional sub-line
  alertLevel?: "none" | "warn" | "crit";
}

function KpiCard({
  label,
  value,
  accentClass,
  note,
  alertLevel = "none",
}: KpiCardProps) {
  const alertDot =
    alertLevel === "crit"
      ? "bg-rose-500"
      : alertLevel === "warn"
        ? "bg-amber-400"
        : "bg-transparent";

  return (
    <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col">
      {/* accent bar — the only "color" element; intentional, not decorative */}
      <div className={`h-0.5 w-full ${accentClass}`} />
      <div className="px-5 py-5 flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {label}
          </p>
          {alertLevel !== "none" && (
            <span className={`h-2 w-2 rounded-full ${alertDot}`} />
          )}
        </div>
        <p className="text-4xl font-black tracking-tight text-[var(--text-main)] leading-none tabular-nums">
          {value}
        </p>
        {note && (
          <p className="text-xs text-[var(--text-muted)] font-medium leading-snug mt-auto">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Status row for the breakdown section ─────────────────────────────────────
interface StatusRowProps {
  label: string;
  count: number;
  total: number;
  barClass: string;
}

function StatusRow({ label, count, total, barClass }: StatusRowProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <p className="w-28 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider shrink-0">
        {label}
      </p>
      <div className="flex-1 h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="w-10 text-right text-sm font-black text-[var(--text-main)] tabular-nums">
        {count}
      </p>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  // Data
  const [allProjects, setAllProjects] = useState<Record<string, unknown>[]>([]);
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [kycProfiles, setKycProfiles] = useState<KycAdminListItem[]>([]);
  const [payouts, setPayouts] = useState<Record<string, unknown>[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [loadingPayouts, setLoadingPayouts] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [kycStatusFilter, setKycStatusFilter] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Actions
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const extractArray = useCallback(
    (payload: unknown, candidates: string[]): Record<string, unknown>[] => {
      if (Array.isArray(payload)) {
        return payload as Record<string, unknown>[];
      }

      if (!payload || typeof payload !== "object") {
        return [];
      }

      const obj = payload as Record<string, unknown>;
      for (const key of candidates) {
        const value = obj[key];
        if (Array.isArray(value)) {
          return value as Record<string, unknown>[];
        }
      }

      const nested = obj.data;
      if (nested && typeof nested === "object") {
        const nestedObj = nested as Record<string, unknown>;
        for (const key of candidates) {
          const value = nestedObj[key];
          if (Array.isArray(value)) {
            return value as Record<string, unknown>[];
          }
        }
      }

      return [];
    },
    [],
  );

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const hasAdminRole = ((user.roles as string[]) || []).some((r) =>
      ["ADMIN", "admin", "SUPERADMIN", "SUPER_ADMIN"].includes(r),
    );
    return hasAdminRole;
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/login?next=/admin");
      return;
    }
    if (!isAdmin && !authLoading) {
      const t = setTimeout(() => {
        if (!isAdmin) router.push("/");
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const data = await projectService.adminListAll();
      const list = extractArray(data, ["projects", "items"]);
      setAllProjects(list);
    } catch (e: unknown) {
      setAllProjects([]);
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(
        msg ||
          "Unable to fetch campaigns. Please re-login with an admin account.",
      );
    } finally {
      setLoadingProjects(false);
    }
  }, [extractArray]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await apiClient.get("/admin/users", {
        params: { limit: 100, skip: 0 },
      });
      const list = extractArray(res.data, ["users", "items"]);
      setUsers(list);
    } catch (e: unknown) {
      setUsers([]);
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(
        msg || "Unable to fetch users. Please re-login with an admin account.",
      );
    } finally {
      setLoadingUsers(false);
    }
  }, [extractArray]);

  const loadKycProfiles = useCallback(async (status?: string) => {
    setLoadingKyc(true);
    try {
      const normalizedStatus =
        typeof status === "string" && status.trim() ? status : undefined;
      const res = await kycAdminService.listProfiles({
        status: normalizedStatus,
        pageSize: 50,
      });
      setKycProfiles(res.items);
    } catch {
      setKycProfiles([]);
    } finally {
      setLoadingKyc(false);
    }
  }, []);

  const loadPayouts = useCallback(async () => {
    setLoadingPayouts(true);
    try {
      const res = await apiClient.get("/wallet/admin/withdrawals/pending");
      setPayouts(res.data as Record<string, unknown>[]);
    } catch {
      setPayouts([]);
    } finally {
      setLoadingPayouts(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void loadProjects();
    void loadUsers();
    void loadKycProfiles();
    void loadPayouts();
  }, [isAdmin, loadKycProfiles, loadPayouts, loadProjects, loadUsers]);

  const overrideKycStatus = async (
    profileId: string,
    status: string,
    reason?: string,
  ) => {
    const tid = toast.loading(
      status === "APPROVED" ? "Approving KYC..." : "Rejecting KYC...",
    );
    try {
      await kycAdminService.overrideStatus(profileId, {
        status,
        rejectionReason: reason,
      });
      toast.success(`KYC ${status.toLowerCase()}`, { id: tid });
      await loadKycProfiles(kycStatusFilter || undefined);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || "Action failed", { id: tid });
    }
  };

  const decide = async (id: string, finalStatus: string) => {
    if (finalStatus === "REJECTED" && !reasons[id]?.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    setActingOn(id);
    const tid = toast.loading("Processing...");
    try {
      await projectService.adminDecision(id, {
        finalStatus,
        reason: reasons[id],
      });
      toast.success(`Project ${finalStatus.replace(/_/g, " ").toLowerCase()}`, {
        id: tid,
      });
      await loadProjects();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || "Action failed", { id: tid });
    } finally {
      setActingOn(null);
    }
  };

  const toggleBlock = async (userId: string, isBlocked: boolean) => {
    setActingOn(userId);
    const tid = toast.loading(
      isBlocked ? "Unblocking user..." : "Blocking user...",
    );
    try {
      await apiClient.patch(`/admin/users/${userId}/block`, {
        isBlocked: !isBlocked,
      });
      toast.success(isBlocked ? "User unblocked" : "User blocked", { id: tid });
      await loadUsers();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || "Action failed", { id: tid });
    } finally {
      setActingOn(null);
    }
  };

  const changeRole = async (userId: string, role: string) => {
    setActingOn(userId);
    const tid = toast.loading("Updating role...");
    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role });
      toast.success(`Role updated to ${role}`, { id: tid });
      await loadUsers();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || "Action failed", { id: tid });
    } finally {
      setActingOn(null);
    }
  };

  const filteredProjects = useMemo(() => {
    let list = allProjects;
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    if (projectSearch) {
      const q = projectSearch.toLowerCase();
      list = list.filter(
        (p) =>
          ((p.name as string) || "").toLowerCase().includes(q) ||
          ((p.summary as string) || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [allProjects, statusFilter, projectSearch]);

  const filteredUsers = useMemo(
    () =>
      users.filter((u) => {
        const q = userSearch.toLowerCase();
        const profile = u.profile as Record<string, string> | undefined;
        const name =
          `${(u.firstName as string) || profile?.firstName || ""} ${(u.lastName as string) || profile?.lastName || ""}`.toLowerCase();
        return (
          ((u.email as string) || "").toLowerCase().includes(q) ||
          name.includes(q)
        );
      }),
    [users, userSearch],
  );

  const pendingCount = allProjects.filter(
    (p) => p.status === "PENDING_REVIEW",
  ).length;
  const pendingKycCount = kycProfiles.filter(
    (p) => p.status === "PENDING" || p.status === "UNDER_REVIEW",
  ).length;
  const approvedCount = allProjects.filter((p) =>
    ["APPROVED", "FUNDING", "FUNDED"].includes(p.status as string),
  ).length;
  const rejectedCount = allProjects.filter(
    (p) => p.status === "REJECTED",
  ).length;
  const draftCount = allProjects.filter((p) => p.status === "DRAFT").length;

  const getCreatorName = (p: Record<string, unknown>): string => {
    const creator = (p.creator || p.creatorId) as
      Record<string, unknown> | undefined;
    if (creator && typeof creator === "object") {
      const profile = creator.profile as Record<string, string> | undefined;
      return (
        [
          profile?.firstName || (creator.firstName as string),
          profile?.lastName || (creator.lastName as string),
        ]
          .filter(Boolean)
          .join(" ") ||
        (creator.email as string) ||
        "Unknown"
      );
    }
    return "Unknown";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center space-y-4">
          <ShieldCheck className="w-16 h-16 text-[var(--text-muted)] mx-auto opacity-30" />
          <p className="text-[var(--text-muted)] font-medium">
            Access restricted
          </p>
          <Link
            href="/"
            className="text-sm font-bold text-[var(--primary)] hover:underline"
          >
            ← Back home
          </Link>
        </div>
      </div>
    );
  }

  const tabs: {
    key: AdminTab;
    label: string;
    icon: ReactNode;
    badge?: number;
  }[] = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
    {
      key: "projects",
      label: "Campaigns",
      icon: <FolderOpen size={16} />,
      badge: pendingCount || undefined,
    },
    {
      key: "kyc",
      label: "KYC Review",
      icon: <ShieldCheck size={16} />,
      badge: pendingKycCount || undefined,
    },
    {
      key: "users",
      label: "Users",
      icon: <Users size={16} />,
      badge: users.length || undefined,
    },
    {
      key: "payouts",
      label: "Payouts",
      icon: <RotateCcw size={16} />,
      badge: payouts.length || undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)]">
      <div className="flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside className="w-60 border-r border-[var(--border)] bg-[var(--card)] flex flex-col py-8 px-3 gap-1 shrink-0 sticky top-0 h-screen overflow-auto">
          <div className="px-3 mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
              Keibo
            </p>
            <h1 className="text-xl font-black">Admin Panel</h1>
          </div>

          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--secondary)]"
              }`}
            >
              <span className="flex items-center gap-3">
                {tab.icon}
                {tab.label}
              </span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-amber-500 text-white"}`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}

          <div className="mt-auto pt-6 border-t border-[var(--border)] space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--secondary)] transition-all"
            >
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
            {/* ══════════════════════════════════════════════════════════════
                OVERVIEW — redesigned
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === "overview" && (
              <div className="w-full space-y-10">
                {/* Page header */}
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--text-muted)] mb-1">
                      Operations
                    </p>
                    <h2 className="text-2xl font-black tracking-tight">
                      Platform Overview
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)] max-w-md">
                      Campaign moderation, identity verification, and payout
                      workload at a glance.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      loadProjects();
                      loadUsers();
                      loadKycProfiles();
                      loadPayouts();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--secondary)] transition-all shrink-0"
                  >
                    <RefreshCw size={14} className="text-[var(--text-muted)]" />
                    Refresh
                  </button>
                </div>

                {/* ── KPI grid ──
                    Five cards. Each has a single color accent bar at top
                    (thin, categorical) + big number + quiet label.
                    No icon boxes, no gradient tiles, no dot decorations.
                    Color only appears as the 2px stripe — rest is surface.
                */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  <KpiCard
                    label="All Campaigns"
                    value={allProjects.length}
                    accentClass="bg-[var(--primary)]"
                    note="across all statuses"
                  />
                  <KpiCard
                    label="Pending Review"
                    value={pendingCount}
                    accentClass="bg-amber-400"
                    note={
                      pendingCount > 0 ? "needs moderation" : "queue is clear"
                    }
                    alertLevel={
                      pendingCount > 5
                        ? "crit"
                        : pendingCount > 0
                          ? "warn"
                          : "none"
                    }
                  />
                  <KpiCard
                    label="Approved / Live"
                    value={approvedCount}
                    accentClass="bg-emerald-500"
                    note="visible to investors"
                  />
                  <KpiCard
                    label="Total Users"
                    value={users.length}
                    accentClass="bg-slate-400"
                    note="registered accounts"
                  />
                  <KpiCard
                    label="Pending Payouts"
                    value={payouts.length}
                    accentClass="bg-rose-500"
                    note={
                      payouts.length > 0
                        ? "awaiting disbursement"
                        : "none pending"
                    }
                    alertLevel={payouts.length > 0 ? "warn" : "none"}
                  />
                </div>

                {/* ── Two-column lower section ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Pending queue — takes 2/3 width */}
                  <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {pendingCount > 0 ? (
                          <AlertCircle
                            size={16}
                            className="text-amber-500 shrink-0"
                          />
                        ) : (
                          <CheckCircle
                            size={16}
                            className="text-emerald-500 shrink-0"
                          />
                        )}
                        <div>
                          <p className="text-sm font-black">Awaiting Review</p>
                          <p className="text-xs text-[var(--text-muted)] font-medium">
                            {pendingCount > 0
                              ? `${pendingCount} campaign${pendingCount === 1 ? "" : "s"} need moderation`
                              : "The queue is clear"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("projects")}
                        className="text-xs font-black text-[var(--primary)] hover:underline flex items-center gap-1 shrink-0"
                      >
                        Manage <ChevronRight size={12} />
                      </button>
                    </div>

                    <div className="divide-y divide-[var(--border)]">
                      {allProjects
                        .filter((p) => p.status === "PENDING_REVIEW")
                        .slice(0, 6)
                        .map((p) => {
                          const id = String(
                            (p._id as string) || (p.id as string),
                          );
                          const creatorName = getCreatorName(p);
                          return (
                            <div
                              key={id}
                              className="px-6 py-3.5 flex items-center gap-4 hover:bg-[var(--secondary)] transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">
                                  {(p.name as string) || "(Untitled)"}
                                </p>
                                <p className="text-xs text-[var(--text-muted)] truncate">
                                  {creatorName}
                                  {p.category
                                    ? ` · ${p.category as string}`
                                    : ""}
                                </p>
                              </div>
                              <Link
                                href={`/projects/${id}`}
                                target="_blank"
                                className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors shrink-0"
                              >
                                <Eye size={14} />
                              </Link>
                            </div>
                          );
                        })}

                      {pendingCount === 0 && (
                        <div className="px-6 py-10 text-center">
                          <p className="text-sm font-semibold text-[var(--text-main)]">
                            No campaigns awaiting action
                          </p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            The moderation queue is clear.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status breakdown — takes 1/3 width */}
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <TrendingUp
                          size={15}
                          className="text-[var(--text-muted)]"
                        />
                        <p className="text-sm font-black">Campaign Breakdown</p>
                      </div>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                      <StatusRow
                        label="Draft"
                        count={draftCount}
                        total={allProjects.length}
                        barClass="bg-slate-400"
                      />
                      <StatusRow
                        label="Pending"
                        count={pendingCount}
                        total={allProjects.length}
                        barClass="bg-amber-400"
                      />
                      <StatusRow
                        label="Approved"
                        count={approvedCount}
                        total={allProjects.length}
                        barClass="bg-emerald-500"
                      />
                      <StatusRow
                        label="Rejected"
                        count={rejectedCount}
                        total={allProjects.length}
                        barClass="bg-rose-500"
                      />

                      <div className="pt-3 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[var(--text-muted)] font-medium">
                            Total
                          </p>
                          <p className="text-lg font-black tabular-nums">
                            {allProjects.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── KYC + Users quick stats ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-5">
                    <div className="shrink-0">
                      <ShieldCheck
                        size={20}
                        className="text-[var(--text-muted)]"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        KYC Review
                      </p>
                      <p className="mt-1 text-2xl font-black tabular-nums">
                        {pendingKycCount}
                        <span className="text-sm font-semibold text-[var(--text-muted)] ml-2">
                          pending
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("kyc")}
                      className="shrink-0 text-xs font-black text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                      Review <ChevronRight size={12} />
                    </button>
                  </div>

                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-5">
                    <div className="shrink-0">
                      <Bell size={20} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        Pending Payouts
                      </p>
                      <p className="mt-1 text-2xl font-black tabular-nums">
                        {payouts.length}
                        <span className="text-sm font-semibold text-[var(--text-muted)] ml-2">
                          {payouts.length === 1 ? "withdrawal" : "withdrawals"}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("payouts")}
                      className="shrink-0 text-xs font-black text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                      Process <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                CAMPAIGNS / PROJECTS — unchanged
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === "projects" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-black">Campaign Management</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Approve, reject, or request changes for submitted
                      campaigns. Rejected campaigns are hidden from the public.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm font-medium outline-none focus:border-[var(--primary)] w-48"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm font-bold outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING_REVIEW">Pending Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="FUNDING">Funding</option>
                      <option value="CHANGES_REQUESTED">
                        Changes Requested
                      </option>
                      <option value="REJECTED">Rejected</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                    <button
                      onClick={loadProjects}
                      disabled={loadingProjects}
                      className="p-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all"
                    >
                      <RefreshCw
                        size={16}
                        className={
                          loadingProjects
                            ? "animate-spin text-[var(--primary)]"
                            : "text-[var(--text-muted)]"
                        }
                      />
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
                  ) : (
                    filteredProjects.map((p) => {
                      const id = String((p._id as string) || (p.id as string));
                      const creatorName = getCreatorName(p);
                      const raised =
                        (p.raisedAmount as number) ||
                        (p.progress as Record<string, number>)?.raisedAmount ||
                        0;
                      const target =
                        (p.targetAmount as number) ||
                        (p.goalAmount as number) ||
                        0;
                      const pct =
                        target > 0 ? Math.min(100, (raised / target) * 100) : 0;
                      const isActing = actingOn === id;
                      const status = p.status as string;
                      const projectCategory =
                        typeof p.category === "string" && p.category.trim()
                          ? p.category
                          : null;
                      const decisionReason =
                        typeof p.decisionReason === "string" &&
                        p.decisionReason.trim()
                          ? p.decisionReason
                          : null;

                      const canApprove = [
                        "PENDING_REVIEW",
                        "CHANGES_REQUESTED",
                        "DRAFT",
                        "REJECTED",
                      ].includes(status);
                      const canRequestChanges = [
                        "PENDING_REVIEW",
                        "APPROVED",
                        "DRAFT",
                      ].includes(status);
                      const canRevoke =
                        status === "APPROVED" || status === "FUNDING";
                      const canReject = !["REJECTED"].includes(status);

                      return (
                        <div
                          key={id}
                          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--primary)]/30 transition-all"
                        >
                          <div className="p-5 border-b border-[var(--border)] flex items-center gap-3 flex-wrap">
                            <StatusBadge status={status} />
                            <span
                              className={`chip-base chip-compact ${((p.projectType as string) || (p.type as string)) === "ROI" ? "chip-info" : "chip-success"}`}
                            >
                              {(p.projectType as string) ||
                                (p.type as string) ||
                                "CHARITY"}
                            </span>
                            {projectCategory && (
                              <span className="chip-base chip-compact chip-neutral">
                                {projectCategory}
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
                            <div className="lg:col-span-4 space-y-2">
                              <h3 className="font-black text-base leading-tight">
                                {(p.name as string) || "(Untitled)"}
                              </h3>
                              <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                                {p.summary as string}
                              </p>
                              <div className="flex items-center gap-2 pt-1">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-[10px] font-black">
                                    {(creatorName[0] || "?").toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-[var(--text-muted)]">
                                  {creatorName}
                                </p>
                              </div>
                              {target > 0 && (
                                <div className="space-y-1 pt-1">
                                  <div className="w-full h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-[var(--text-muted)] font-medium">
                                    {(p.currency as string) || "UGX"}{" "}
                                    {raised.toLocaleString()} raised of{" "}
                                    {target.toLocaleString()} ({pct.toFixed(0)}
                                    %)
                                  </p>
                                </div>
                              )}
                              {decisionReason && (
                                <p className="text-xs text-amber-800 dark:text-amber-200 font-medium bg-amber-50 dark:bg-amber-950/20 rounded-lg px-2 py-1 border border-amber-200 dark:border-amber-900/30">
                                  Previous note: {decisionReason}
                                </p>
                              )}
                            </div>

                            <div className="lg:col-span-5 space-y-2 flex flex-col">
                              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                Admin Note / Feedback{" "}
                                <span className="text-rose-400">
                                  (required for rejection)
                                </span>
                              </label>
                              <textarea
                                rows={4}
                                className="input_field text-sm resize-none flex-1"
                                value={reasons[id] || ""}
                                onChange={(e) =>
                                  setReasons((r) => ({
                                    ...r,
                                    [id]: e.target.value,
                                  }))
                                }
                                placeholder="Provide feedback to the campaign creator..."
                              />
                            </div>

                            <div className="lg:col-span-3 flex flex-col gap-2 justify-start">
                              {canApprove && (
                                <button
                                  onClick={() => decide(id, "APPROVED")}
                                  disabled={isActing}
                                  className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
                                >
                                  {isActing ? (
                                    <Loader2
                                      size={12}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <CheckCircle size={12} />
                                  )}
                                  Approve
                                </button>
                              )}
                              {canRequestChanges && (
                                <button
                                  onClick={() =>
                                    decide(id, "CHANGES_REQUESTED")
                                  }
                                  disabled={isActing}
                                  className="py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60 transition-all"
                                >
                                  Request Changes
                                </button>
                              )}
                              {canRevoke && (
                                <button
                                  onClick={() => decide(id, "REJECTED")}
                                  disabled={isActing}
                                  className="py-3 rounded-xl border border-rose-300 text-rose-700 dark:border-rose-900/40 dark:text-rose-300 text-[10px] font-black uppercase tracking-widest disabled:opacity-60 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center gap-2"
                                >
                                  {isActing ? (
                                    <Loader2
                                      size={12}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <XCircle size={12} />
                                  )}
                                  Revoke
                                </button>
                              )}
                              {canReject && !canRevoke && (
                                <button
                                  onClick={() => decide(id, "REJECTED")}
                                  disabled={isActing}
                                  className="py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
                                >
                                  {isActing ? (
                                    <Loader2
                                      size={12}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <XCircle size={12} />
                                  )}
                                  Reject
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                KYC REVIEW — unchanged
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === "kyc" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-black">KYC Review</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Review and approve/reject identity verifications submitted
                      by users.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={kycStatusFilter}
                      onChange={(e) => {
                        setKycStatusFilter(e.target.value);
                        loadKycProfiles(e.target.value);
                      }}
                      className="px-3 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm font-bold outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                    <button
                      onClick={() => loadKycProfiles()}
                      disabled={loadingKyc}
                      className="p-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all"
                    >
                      <RefreshCw
                        size={16}
                        className={
                          loadingKyc
                            ? "animate-spin text-[var(--primary)]"
                            : "text-[var(--text-muted)]"
                        }
                      />
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
                    {kycProfiles.map((kyc) => {
                      const statusColors: Record<string, string> = {
                        APPROVED: "chip-success",
                        PENDING: "chip-warning",
                        UNDER_REVIEW: "chip-warning",
                        REJECTED: "chip-danger",
                        EXPIRED: "chip-warning",
                      };
                      const sc = statusColors[kyc.status] ?? "chip-neutral";
                      const isPending =
                        kyc.status === "PENDING" ||
                        kyc.status === "UNDER_REVIEW";
                      return (
                        <div
                          key={kyc.id}
                          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 flex-wrap hover:border-[var(--primary)]/30 transition-all"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center flex-shrink-0">
                            <ShieldCheck
                              size={18}
                              className="text-[var(--text-muted)]"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-sm">
                              {kyc.userName || `User ${kyc.userId.slice(-8)}`}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] font-medium">
                              {kyc.userEmail ? `${kyc.userEmail} · ` : ""}
                              {kyc.documentCount} document(s) · Submitted{" "}
                              {kyc.submittedAt
                                ? new Date(kyc.submittedAt).toLocaleDateString()
                                : "—"}
                            </p>
                          </div>
                          <span className={`chip-base chip-compact ${sc}`}>
                            {kyc.status}
                          </span>
                          {isPending && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  overrideKycStatus(kyc.id, "APPROVED")
                                }
                                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt(
                                    "Rejection reason (shown to user):",
                                  );
                                  if (reason !== null)
                                    overrideKycStatus(
                                      kyc.id,
                                      "REJECTED",
                                      reason,
                                    );
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

            {/* ══════════════════════════════════════════════════════════════
                USERS — unchanged
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-black">User Management</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Block/unblock users and change their roles.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm outline-none focus:border-[var(--primary)] w-52"
                      />
                    </div>
                    <button
                      onClick={loadUsers}
                      disabled={loadingUsers}
                      className="p-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all"
                    >
                      <RefreshCw
                        size={16}
                        className={
                          loadingUsers
                            ? "animate-spin text-[var(--primary)]"
                            : "text-[var(--text-muted)]"
                        }
                      />
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden">
                  <div className="hidden lg:grid grid-cols-12 px-6 py-3 border-b border-[var(--border)] bg-[var(--secondary)]">
                    {(
                      [
                        ["User", "col-span-3"],
                        ["Email", "col-span-3"],
                        ["KYC", "col-span-2"],
                        ["Role", "col-span-2"],
                        ["Actions", "col-span-2"],
                      ] as [string, string][]
                    ).map(([h, cls]) => (
                      <div
                        key={h}
                        className={`text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ${cls}`}
                      >
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
                      <div className="p-12 text-center text-[var(--text-muted)] font-medium">
                        No users found.
                      </div>
                    ) : (
                      filteredUsers.map((u) => {
                        const uid = (u.id as string) || (u._id as string);
                        const profile = u.profile as
                          Record<string, string> | undefined;
                        const firstName =
                          (u.firstName as string) || profile?.firstName || "";
                        const lastName =
                          (u.lastName as string) || profile?.lastName || "";
                        const displayName =
                          [firstName, lastName].filter(Boolean).join(" ") ||
                          "Unknown";
                        const role = ((u.roles as string[]) || [
                          (u.role as string) || "INVESTOR",
                        ])[0];
                        const isBlocked = u.isBlocked as boolean;
                        const isActingUser = actingOn === uid;
                        const isCurrentAdmin =
                          uid ===
                          ((user?.id as string) || (user?._id as string));

                        return (
                          <div
                            key={uid}
                            className={`px-6 py-4 hover:bg-[var(--secondary)] transition-colors ${isBlocked ? "opacity-60" : ""}`}
                          >
                            {/* Mobile */}
                            <div className="lg:hidden space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                                  {(firstName ||
                                    (u.email as string) ||
                                    "?")[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm">
                                    {displayName}
                                  </p>
                                  <p className="text-xs text-[var(--text-muted)]">
                                    {u.email as string}
                                  </p>
                                </div>
                                <span
                                  className={`chip-base chip-compact ${isBlocked ? "chip-danger" : "chip-info"}`}
                                >
                                  {role}
                                </span>
                              </div>
                              {!isCurrentAdmin && (
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => toggleBlock(uid, isBlocked)}
                                    disabled={isActingUser}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${
                                      isBlocked
                                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300"
                                        : "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/30 dark:text-rose-300"
                                    }`}
                                  >
                                    {isActingUser ? (
                                      <Loader2
                                        size={10}
                                        className="animate-spin"
                                      />
                                    ) : isBlocked ? (
                                      <UserCheck size={10} />
                                    ) : (
                                      <Ban size={10} />
                                    )}
                                    {isBlocked ? "Unblock" : "Block"}
                                  </button>
                                  <select
                                    onChange={(e) =>
                                      changeRole(uid, e.target.value)
                                    }
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

                            {/* Desktop */}
                            <div className="hidden lg:grid grid-cols-12 items-center gap-2">
                              <div className="col-span-3 flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                                  {(firstName ||
                                    (u.email as string) ||
                                    "?")[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-sm truncate">
                                    {displayName}
                                  </p>
                                  <p className="text-[10px] text-[var(--text-muted)] font-medium">
                                    {u.emailVerifiedAt
                                      ? "✓ Verified"
                                      : "Unverified"}
                                    {isBlocked && " · Blocked"}
                                  </p>
                                </div>
                              </div>
                              <div className="col-span-3 text-sm text-[var(--text-muted)] font-medium truncate pr-4">
                                {u.email as string}
                              </div>
                              <div className="col-span-2">
                                <span
                                  className={`chip-base chip-compact ${u.kycStatus === "VERIFIED" ? "chip-success" : u.kycStatus === "PENDING" ? "chip-warning" : "chip-neutral"}`}
                                >
                                  {(u.kycStatus as string) || "NOT VERIFIED"}
                                </span>
                              </div>
                              <div className="col-span-2">
                                {isCurrentAdmin ? (
                                  <span className="chip-base chip-compact chip-violet">
                                    {role} (you)
                                  </span>
                                ) : (
                                  <select
                                    onChange={(e) =>
                                      changeRole(uid, e.target.value)
                                    }
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
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                      isBlocked
                                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300"
                                        : "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/30 dark:text-rose-300"
                                    }`}
                                  >
                                    {isActingUser ? (
                                      <Loader2
                                        size={10}
                                        className="animate-spin"
                                      />
                                    ) : isBlocked ? (
                                      <UserCheck size={10} />
                                    ) : (
                                      <Ban size={10} />
                                    )}
                                    {isBlocked ? "Unblock" : "Block"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                PAYOUTS — unchanged
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === "payouts" && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black tracking-tight">
                    Pending ROI Payouts
                  </h3>
                  <button
                    onClick={loadPayouts}
                    className="p-2 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:bg-white/5 transition-all"
                  >
                    <RefreshCw
                      size={18}
                      className={loadingPayouts ? "animate-spin" : ""}
                    />
                  </button>
                </div>

                {loadingPayouts ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                  </div>
                ) : payouts.length === 0 ? (
                  <div className="py-20 text-center text-[var(--text-muted)] space-y-4">
                    <CheckCircle className="w-12 h-12 mx-auto text-emerald-500/30" />
                    <p>No pending ROI payouts requiring approval.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payouts.map((payout) => {
                      const pid = payout._id as string;
                      const project = payout.projectId as
                        Record<string, unknown> | undefined;
                      const payoutUser = payout.userId as
                        Record<string, unknown> | undefined;
                      const metadata = payout.metadata as
                        Record<string, unknown> | undefined;
                      const method = metadata?.method as
                        Record<string, unknown> | undefined;
                      return (
                        <div
                          key={pid}
                          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6"
                        >
                          <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-3">
                                <span className="chip-base chip-compact chip-warning">
                                  ROI Withdrawal
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                                  Ref: {pid}
                                </span>
                              </div>
                              <div>
                                <p className="font-black text-lg">
                                  {(project?.name as string) ||
                                    "Unknown Project"}
                                </p>
                                <p className="text-sm text-[var(--text-muted)]">
                                  Requested by:{" "}
                                  {payoutUser?.firstName as string}{" "}
                                  {payoutUser?.lastName as string} (
                                  {payoutUser?.email as string})
                                </p>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                                <div>
                                  <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider mb-1">
                                    Amount Requested
                                  </p>
                                  <p className="font-bold text-sm">
                                    UGX{" "}
                                    {Math.abs(
                                      payout.amount as number,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider mb-1">
                                    Fee (2%)
                                  </p>
                                  <p className="font-bold text-sm text-amber-700 dark:text-amber-300">
                                    UGX{" "}
                                    {(
                                      (metadata?.platformFee as number) || 0
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider mb-1">
                                    Net Payout
                                  </p>
                                  <p className="font-black text-lg text-emerald-700 dark:text-emerald-300">
                                    UGX{" "}
                                    {(
                                      (metadata?.payoutAmount as number) || 0
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider mb-1">
                                    Destination
                                  </p>
                                  <p className="text-xs font-bold">
                                    {method?.provider as string} •{" "}
                                    {method?.accountNumber as string}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 min-w-[200px] justify-center">
                              <button
                                onClick={async () => {
                                  const tid = toast.loading(
                                    "Approving payment...",
                                  );
                                  try {
                                    setActingOn(pid);
                                    await apiClient.post(
                                      `/wallet/admin/withdrawals/${pid}/approve`,
                                    );
                                    toast.success(
                                      "Payment approved & processed successfully!",
                                      { id: tid },
                                    );
                                    loadPayouts();
                                  } catch (e: unknown) {
                                    const msg = (
                                      e as {
                                        response?: {
                                          data?: { message?: string };
                                        };
                                      }
                                    )?.response?.data?.message;
                                    toast.error(msg || "Approval failed", {
                                      id: tid,
                                    });
                                  } finally {
                                    setActingOn(null);
                                  }
                                }}
                                disabled={actingOn === pid}
                                className="bg-emerald-500 text-white font-black text-xs uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                              >
                                {actingOn === pid ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Approve & Disburse
                              </button>

                              <button
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      "Are you sure you want to REJECT and refund this payout to the user?",
                                    )
                                  )
                                    return;
                                  const tid = toast.loading(
                                    "Rejecting payment...",
                                  );
                                  try {
                                    setActingOn(`reject_${pid}`);
                                    await apiClient.post(
                                      `/wallet/admin/withdrawals/${pid}/reject`,
                                    );
                                    toast.success(
                                      "Payment rejected & refunded",
                                      { id: tid },
                                    );
                                    loadPayouts();
                                  } catch (e: unknown) {
                                    const msg = (
                                      e as {
                                        response?: {
                                          data?: { message?: string };
                                        };
                                      }
                                    )?.response?.data?.message;
                                    toast.error(msg || "Rejection failed", {
                                      id: tid,
                                    });
                                  } finally {
                                    setActingOn(null);
                                  }
                                }}
                                disabled={actingOn === `reject_${pid}`}
                                className="bg-transparent border border-rose-300 text-rose-700 dark:border-rose-900/40 dark:text-rose-300 font-bold text-xs uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center gap-2"
                              >
                                {actingOn === `reject_${pid}` ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                Reject & Refund
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
