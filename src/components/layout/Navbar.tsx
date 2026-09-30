"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { canAccessROI } from "@/lib/roi-access";
import { Logo } from "../common/Logo";
import {
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  User,
  ChevronDown,
  Heart,
  Layers3,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { openWeb3Modal } from "@/providers/Web3Provider";

function getNavbarWalletAddress(
  user: unknown,
  connectedAddress?: string,
): string {
  const currentUser = user as {
    primaryWallet?: string;
    linkedWallets?: string[];
  } | null;

  return (
    connectedAddress ||
    currentUser?.primaryWallet ||
    currentUser?.linkedWallets?.[0] ||
    ""
  );
}

function formatWalletAddress(address: string): string {
  if (address.length <= 12) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { address, isConnected } = useAccount();

  const isAdmin = React.useMemo(() => {
    if (!user) return false;
    const hasAdminRole = (user.roles || []).some((r: string) =>
      ["ADMIN", "SUPERADMIN"].includes(r.toUpperCase()),
    );
    return hasAdminRole;
  }, [user]);

  const hasRoiAccess = React.useMemo(() => canAccessROI(user), [user]);
  const walletAddress = React.useMemo(
    () => getNavbarWalletAddress(user, isConnected ? address : undefined),
    [address, isConnected, user],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  // Close mobile menu on route change
  useEffect(() => {
    queueMicrotask(() => {
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
    });
  }, [pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const submitSearch = () => {
    const sp = new URLSearchParams();
    if (searchQuery.trim()) sp.set("search", searchQuery.trim());
    const qs = sp.toString();
    router.push(qs ? `/explore?${qs}` : "/explore");
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
  };

  const navCategories = [
    { href: "/explore", label: "All Projects" },
    { href: "/explore?category=HEALTH", label: "Health" },
    { href: "/explore?category=EDUCATION", label: "Education" },
    { href: "/explore?category=ENVIRONMENT", label: "Environment" },
    { href: "/explore?category=COMMUNITY", label: "Community" },
    ...(hasRoiAccess
      ? [
          { href: "/explore?industry=REAL_ESTATE", label: "Real Estate" },
          { href: "/explore?industry=TECHNOLOGY", label: "Technology" },
          { href: "/explore?industry=AGRICULTURE", label: "Agriculture" },
          { href: "/explore?industry=ENERGY", label: "Energy" },
        ]
      : []),
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border)] transition-colors duration-300">
        <div className="page-shell h-[68px] flex items-center justify-between relative">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <Logo size={26} />
            </Link>
          </div>

          {/* Desktop Center: Explore dropdown + Search */}
          <div className="hidden md:flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
            {/* Explore — click navigates, hover shows dropdown */}
            <div className="relative group">
              <Link
                href="/explore"
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--text-main)]"
              >
                Explore
                <ChevronDown size={14} className="opacity-60" />
              </Link>
              <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="w-56 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] py-2 shadow-lg">
                  <p className="px-4 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Browse by type
                  </p>
                  <Link
                    href="/explore"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-[var(--secondary)] transition-colors"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--secondary)] text-[var(--text-muted)]">
                      <Layers3 size={13} />
                    </span>
                    All Projects
                  </Link>
                  <Link
                    href="/explore?type=CHARITY"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-[var(--secondary)] transition-colors"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                      <Heart size={13} />
                    </span>
                    Charity Causes
                  </Link>
                  {hasRoiAccess && (
                    <Link
                      href="/explore?type=ROI"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-[var(--secondary)] transition-colors"
                    >
                      <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xs">
                        ↑
                      </span>
                      Investments
                    </Link>
                  )}
                  <div className="border-t border-[var(--border)] mx-3 my-1" />
                  <Link
                    href="/dashboard/create-project"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold">
                      +
                    </span>
                    Start a Campaign
                  </Link>
                </div>
              </div>
            </div>

            {/* Marketplace link
            <Link
              href="/marketplace"
              className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-muted)] hover:text-purple-500 transition-colors tracking-tight px-3 py-2 rounded-xl hover:bg-purple-500/5"
            >
              <Store size={15} className="text-purple-500" />
              Marketplace
            </Link> */}

            {/* Search bar */}
            <div ref={searchWrapRef} className="relative w-[320px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitSearch();
                  }}
                  placeholder="Search projects"
                  className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--secondary)] pl-11 pr-24 text-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                />
                <button
                  onClick={submitSearch}
                  className="absolute right-1.5 top-1/2 h-7 -translate-y-1/2 rounded px-3 bg-emerald-700 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Right: Auth */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {hasRoiAccess ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (walletAddress) {
                        openWeb3Modal();
                        return;
                      }

                      openWeb3Modal();
                    }}
                    className="hidden lg:flex items-center gap-2 rounded-md bg-[var(--primary)] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
                  >
                    <Wallet size={14} />
                    {walletAddress
                      ? formatWalletAddress(walletAddress)
                      : "Connect Wallet"}
                  </button>
                ) : (
                  <Link
                    href="/dashboard/create-project"
                    className="hidden lg:flex items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
                  >
                    + Start Campaign
                  </Link>
                )}
                <div className="relative group">
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--primary)] transition-colors hover:border-[var(--primary)]"
                    aria-label="Open account menu"
                  >
                    <User size={20} />
                  </button>
                  <div className="absolute right-0 z-50 mt-2 w-52 invisible rounded-lg border border-[var(--border)] bg-[var(--card)] py-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors"
                    >
                      <LayoutDashboard size={16} /> Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-[var(--secondary)] transition-colors"
                    >
                      <Settings size={16} /> Settings
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors border-t border-[var(--border)] mt-1 pt-2"
                      >
                        <ShieldCheck size={16} /> Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors border-t border-[var(--border)] mt-2"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-bold text-[var(--text-main)] hover:text-[var(--primary)] transition-colors px-3"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="button_primary py-2 px-5 text-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right: Search icon + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                setMobileMenuOpen(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setMobileSearchOpen(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (sliding) */}
        {mobileSearchOpen && (
          <div className="md:hidden border-t border-[var(--border)] px-4 py-3 bg-[var(--card)]/95 backdrop-blur-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch();
                }}
                placeholder="Search projects"
                className="h-11 w-full rounded-md border border-[var(--border)] bg-[var(--secondary)] pl-11 pr-24 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
              />
              <button
                onClick={submitSearch}
                className="absolute right-2 top-1/2 h-7 -translate-y-1/2 rounded bg-emerald-700 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
              >
                Go
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Full-Screen Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" ref={mobileMenuRef}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Slide-in drawer from right */}
          <div className="absolute top-[68px] right-0 bottom-0 w-[85%] max-w-sm bg-[var(--card)] border-l border-[var(--border)] shadow-2xl flex flex-col overflow-y-auto">
            {/* User section */}
            <div className="p-5 border-b border-[var(--border)]">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--secondary)] text-[var(--primary)] flex items-center justify-center border border-[var(--primary)]/20 flex-shrink-0">
                    <User size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-[var(--text-main)] truncate">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-black text-sm text-[var(--text-muted)] uppercase tracking-widest">
                    Welcome to Keibo
                  </p>
                  <div className="flex gap-3">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-bold text-center text-[var(--text-main)] hover:bg-[var(--secondary)] transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-white text-sm font-bold text-center hover:opacity-90 transition-all"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Nav Links */}
            <div className="flex-1 p-4 space-y-1">
              {user && (
                <>
                  <MobileNavLink
                    href="/dashboard"
                    icon={<LayoutDashboard size={18} />}
                    label="Dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <MobileNavLink
                    href="/profile"
                    icon={<Settings size={18} />}
                    label="Settings"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  {isAdmin && (
                    <MobileNavLink
                      href="/admin"
                      icon={
                        <ShieldCheck size={18} className="text-amber-500" />
                      }
                      label="Admin Dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                    />
                  )}
                  <div className="py-2">
                    <div className="h-px bg-[var(--border)]" />
                  </div>
                </>
              )}

              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] px-3 py-1">
                Explore
              </p>

              {navCategories.map((cat) => (
                <MobileNavLink
                  key={cat.href}
                  href={cat.href}
                  icon={<Heart size={18} />}
                  label={cat.label}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}

              <div className="py-2">
                <div className="h-px bg-[var(--border)]" />
              </div>

              <Link
                href="/dashboard/create-project"
                onClick={() => setMobileMenuOpen(false)}
                className="mx-1 mt-2 flex items-center justify-between gap-3 rounded-md bg-emerald-700 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
              >
                <span>Start a Campaign</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Sign Out */}
            {user && (
              <div className="p-4 border-t border-[var(--border)]">
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-rose-500/20"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const MobileNavLink = ({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-[var(--text-main)] transition-colors hover:bg-[var(--secondary)]"
  >
    <span className="text-[var(--text-muted)]">{icon}</span>
    {label}
  </Link>
);

export default Navbar;
