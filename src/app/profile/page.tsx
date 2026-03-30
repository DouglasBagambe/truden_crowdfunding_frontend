'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import {
  User, Wallet, Shield, Bell, Sun, Moon, Mail,
  HelpCircle, Send, TrendingUp, TrendingDown, Monitor,
  Activity, Loader2, Eye, EyeOff, CheckCircle, ShieldCheck, XCircle, Clock, AlertTriangle
} from 'lucide-react';
import { userService } from '@/lib/user-service';
import { walletService, type WalletBalance } from '@/lib/wallet-service';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'wallet' | 'notifications' | 'appearance' | 'security';

export default function SettingsPage() {
  const router = useRouter();
  const { user, refetchUser, isAuthenticated, isLoading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [themeReady, setThemeReady] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Wallet state
  const [wallet, setWallet] = useState<any>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);

  // Notification prefs (local only for now)
  const [notifDonations, setNotifDonations] = useState(true);
  const [notifMilestones, setNotifMilestones] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);

  useEffect(() => { setThemeReady(true); }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    if (user) {
      const p = user.profile || {};
      let fn = p.firstName || user.firstName || '';
      let ln = p.lastName || user.lastName || '';
      const dn = p.displayName || user.displayName || '';
      if (!fn && !ln && dn && dn !== user.email) {
        if (dn.includes(' ')) { const parts = dn.split(' '); fn = parts[0]; ln = parts.slice(1).join(' '); }
        else { fn = dn; }
      }
      setFirstName(fn); setLastName(ln); setEmail(user.email || '');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (activeTab === 'wallet' && !wallet) loadWallet();
  }, [activeTab]);

  const loadWallet = async () => {
    setWalletLoading(true);
    try {
      const [w, b, txs] = await Promise.all([
        walletService.getWallet(),
        walletService.getBalance(),
        walletService.getTransactions(),
      ]);
      setWallet(w); setBalance(b); setTransactions(txs);
    } catch { /* silent */ } finally { setWalletLoading(false); }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const updateData: any = {};
      if (firstName !== (user?.profile?.firstName || user?.firstName)) updateData.firstName = firstName;
      if (lastName !== (user?.profile?.lastName || user?.lastName)) updateData.lastName = lastName;
      if (email !== user?.email) updateData.email = email;
      if (password) updateData.password = password;
      if (Object.keys(updateData).length === 0) { toast.success('No changes to save'); return; }
      await userService.updateProfile(updateData);
      toast.success('Profile updated successfully');
      refetchUser();
      setPassword('');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update profile');
    } finally { setIsSaving(false); }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'wallet', label: 'Wallet', icon: <Wallet size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'appearance', label: 'Appearance', icon: <Sun size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  ];

  const ugxBalance = balance?.fiatBalance?.UGX ?? 0;

  return (
    <div className="bg-[var(--background)] min-h-screen text-[var(--text-main)] pt-[68px] transition-colors duration-300">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 py-8 lg:py-12 lg:px-10 max-w-6xl">
        {isLoading ? (
          <div className="h-48 bg-[var(--card)] rounded-2xl border border-[var(--border)] animate-pulse" />
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">

            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Settings</h1>
              <p className="text-[var(--text-muted)] font-medium text-sm sm:text-base">Manage your account, wallet, and preferences.</p>
            </div>

            {/* Mobile: horizontal tab bar */}
            <div className="lg:hidden -mx-4 px-4 sm:-mx-6 sm:px-6">
              <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-[var(--card)] border border-[var(--border)] rounded-2xl p-1.5">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:bg-[var(--secondary)] hover:text-[var(--text-main)]'
                      }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
                <button
                  onClick={() => { if (confirm('Sign out of your account?')) logout(); }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all whitespace-nowrap flex-shrink-0"
                >
                  Sign Out
                </button>
              </div>
            </div>

            <div className="flex gap-8">

              {/* Desktop Sidebar Nav */}
              <aside className="hidden lg:block w-56 flex-shrink-0">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-2 sticky top-24 space-y-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id
                        ? 'bg-[var(--primary)] text-white shadow-sm'
                        : 'text-[var(--text-muted)] hover:bg-[var(--secondary)] hover:text-[var(--text-main)]'
                        }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                  <div className="border-t border-[var(--border)] pt-2 mt-2">
                    <button
                      onClick={() => { if (confirm('Sign out of your account?')) logout(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </aside>

              {/* Content Panel */}
              <div className="flex-1 min-w-0">

                {/* ── PROFILE ── */}
                {activeTab === 'profile' && (
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 space-y-8">
                    <div>
                      <h2 className="text-xl font-black">Profile</h2>
                      <p className="text-sm text-[var(--text-muted)] mt-1">Update your personal information.</p>
                    </div>

                    {/* Avatar */}
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-3xl font-black">
                          {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold">{firstName} {lastName}</p>
                        <p className="text-sm text-[var(--text-muted)]">{email}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {user?.emailVerifiedAt && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-semibold">
                              <CheckCircle size={12} /> Email Verified
                            </span>
                          )}
                          {/* KYC Status Badge */}
                          {(() => {
                            const kycStatus = (user as any)?.kycStatus || 'NOT_VERIFIED';
                            if (kycStatus === 'VERIFIED') {
                              return (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                                  <ShieldCheck size={12} /> KYC Verified
                                </span>
                              );
                            }
                            if (kycStatus === 'PENDING') {
                              return (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg">
                                  <Clock size={12} /> KYC Under Review
                                </span>
                              );
                            }
                            if (kycStatus === 'REJECTED') {
                              return (
                                <button
                                  onClick={() => router.push('/dashboard?tab=kyc')}
                                  className="inline-flex items-center gap-1 text-xs text-rose-500 font-semibold bg-rose-500/10 px-2.5 py-1 rounded-lg hover:bg-rose-500/20 transition-all cursor-pointer"
                                >
                                  <XCircle size={12} /> KYC Rejected · Re-verify →
                                </button>
                              );
                            }
                            return (
                              <button
                                onClick={() => router.push('/dashboard?tab=kyc')}
                                className="inline-flex items-center gap-1 text-xs text-blue-400 font-semibold bg-blue-500/10 px-2.5 py-1 rounded-lg hover:bg-blue-500/20 transition-all cursor-pointer"
                              >
                                <ShieldCheck size={12} /> Verify Identity →
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FieldGroup label="First Name">
                        <input className="input_field" value={firstName} onChange={e => setFirstName(e.target.value)} />
                      </FieldGroup>
                      <FieldGroup label="Last Name">
                        <input className="input_field" value={lastName} onChange={e => setLastName(e.target.value)} />
                      </FieldGroup>
                    </div>

                    <FieldGroup label="Email Address">
                      <input className="input_field" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    </FieldGroup>

                    <FieldGroup label="New Password">
                      <div className="relative">
                        <input
                          className="input_field pr-12"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Leave blank to keep unchanged"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FieldGroup>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleUpdateProfile}
                        disabled={isSaving}
                        className="button_primary px-10 disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── WALLET ── */}
                {activeTab === 'wallet' && (
                  <div className="space-y-6">
                    {walletLoading ? (
                      <div className="py-24 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* Balance Card */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 rounded-3xl p-8 text-white shadow-2xl border border-white/10">
                          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-36 translate-x-36 blur-3xl pointer-events-none" />
                          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-28 -translate-x-28 blur-2xl pointer-events-none" />

                          <div className="relative z-10 flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 rounded-xl border border-white/20 backdrop-blur">
                                  <Wallet className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-black tracking-tight">Keibo Wallet</h2>
                              </div>
                              <div>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Withdrawable Balance</p>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-white/50 text-sm font-bold">UGX</span>
                                  <span className="text-5xl font-black">{ugxBalance.toLocaleString()}</span>
                                </div>
                                <p className="text-white/40 text-xs mt-1.5">Funds from donations you receive. Withdraw anytime.</p>
                              </div>
                            </div>

                            <div className="flex flex-col gap-3 min-w-[180px]">
                              <button
                                onClick={() => router.push('/dashboard/withdraw')}
                                className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-white/20 hover:bg-white/30 border border-white/20 backdrop-blur rounded-2xl font-black text-sm uppercase tracking-wider transition-all"
                              >
                                <Send className="w-4 h-4" /> Withdraw
                              </button>
                              <p className="text-center text-[11px] text-white/40 font-medium">2% Keibo platform fee applies</p>
                            </div>
                          </div>
                        </div>

                        {/* Transactions */}
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
                          <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                            <h3 className="font-black flex items-center gap-2 text-base">
                              <Activity size={18} className="text-emerald-500" /> Transaction History
                            </h3>
                            <button onClick={loadWallet} className="text-xs text-[var(--primary)] hover:underline font-bold">Refresh</button>
                          </div>

                          {transactions.length === 0 ? (
                            <div className="py-16 text-center">
                              <p className="text-[var(--text-muted)] font-medium">No transactions yet.</p>
                              <p className="text-xs text-[var(--text-muted)] mt-1 opacity-60">Donations you receive will appear here.</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-[var(--border)]">
                              {transactions.slice(0, 15).map((tx: any) => (
                                <div key={tx._id} className="flex items-center justify-between p-5 hover:bg-[var(--secondary)] transition-colors">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                      }`}>
                                      {tx.amount > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm">{tx.amount < 0 ? 'Withdrawal' : 'Donation Received'}</p>
                                      <p className="text-xs text-[var(--text-muted)]">
                                        {new Date(tx.createdAt).toLocaleDateString()} · {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className={`font-black text-sm ${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {tx.amount > 0 ? '+' : ''}{tx.currency} {Math.abs(tx.amount).toLocaleString()}
                                    </p>
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[var(--secondary)] text-[var(--text-muted)]">
                                      {tx.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── NOTIFICATIONS ── */}
                {activeTab === 'notifications' && (
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 space-y-8">
                    <div>
                      <h2 className="text-xl font-black">Notifications</h2>
                      <p className="text-sm text-[var(--text-muted)] mt-1">Choose what you want to be alerted about.</p>
                    </div>
                    <div className="space-y-6 divide-y divide-[var(--border)]">
                      <NotifRow
                        label="Donation Alerts"
                        desc="Get notified by email when someone donates to your campaign."
                        checked={notifDonations}
                        onChange={setNotifDonations}
                      />
                      <NotifRow
                        label="Campaign Milestones"
                        desc="Receive updates when your campaign hits funding targets."
                        checked={notifMilestones}
                        onChange={setNotifMilestones}
                        className="pt-6"
                      />
                      <NotifRow
                        label="Platform News & Tips"
                        desc="Occasional tips and product updates from the Keibo team."
                        checked={notifMarketing}
                        onChange={setNotifMarketing}
                        className="pt-6"
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button onClick={() => toast.success('Notification preferences saved')} className="button_primary px-10">
                        Save Preferences
                      </button>
                    </div>
                  </div>
                )}

                {/* ── APPEARANCE ── */}
                {activeTab === 'appearance' && (
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 space-y-6">
                    <div>
                      <h2 className="text-xl font-bold">Appearance</h2>
                      <p className="text-sm text-[var(--text-muted)] mt-1">Choose how Keibo looks for you.</p>
                    </div>

                    {themeReady && (
                      <div className="grid grid-cols-3 gap-4">
                        {([
                          { id: 'light', label: 'Light', icon: <Sun size={22} className="text-amber-400" />, preview: 'bg-white border-gray-200' },
                          { id: 'dark', label: 'Dark', icon: <Moon size={22} className="text-blue-400" />, preview: 'bg-[#0d1828] border-[#1e2d45]' },
                          { id: 'system', label: 'System', icon: <Monitor size={22} className="text-[var(--text-muted)]" />, preview: 'bg-gradient-to-br from-white to-[#0d1828] border-gray-300' },
                        ] as const).map((opt) => {
                          const active = theme === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setTheme(opt.id)}
                              className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all text-center ${
                                active
                                  ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                  : 'border-[var(--border)] hover:border-[var(--text-muted)]/40 hover:bg-[var(--secondary)]'
                              }`}
                            >
                              <div className={`w-full h-16 rounded-xl border ${opt.preview} flex items-center justify-center`}>
                                {opt.icon}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{opt.label}</span>
                                {active && <CheckCircle size={14} className="text-[var(--primary)]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── SECURITY ── */}
                {activeTab === 'security' && (
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 space-y-6">
                    <div>
                      <h2 className="text-xl font-bold">Security</h2>
                      <p className="text-sm text-[var(--text-muted)] mt-1">Manage your account security settings.</p>
                    </div>

                    <div className="space-y-3">
                      {/* Password */}
                      <div className="flex items-center justify-between p-5 rounded-2xl border border-[var(--border)] bg-[var(--secondary)]">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm">Password</p>
                          <p className="text-xs text-[var(--text-muted)]">Update your login password from the Profile tab.</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('profile')}
                          className="text-xs font-semibold px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--card)] transition-all"
                        >
                          Change
                        </button>
                      </div>

                      {/* 2FA */}
                      <div className="flex items-center justify-between p-5 rounded-2xl border border-[var(--border)] bg-[var(--secondary)]">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm">Two-Factor Authentication</p>
                          <p className="text-xs text-[var(--text-muted)]">Add an extra verification step when signing in.</p>
                        </div>
                        <Toggle checked={!!user?.mfaEnabled} onChange={() => toast('2FA setup coming soon', { icon: '🔒' })} />
                      </div>

                      {/* KYC */}
                      {(() => {
                        const kycStatus = (user as any)?.kycStatus || 'NOT_VERIFIED';
                        return (
                          <div className="flex items-center justify-between p-5 rounded-2xl border border-[var(--border)] bg-[var(--secondary)]">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-sm">Identity Verification (KYC)</p>
                              <p className="text-xs text-[var(--text-muted)]">
                                {kycStatus === 'VERIFIED' ? 'Your identity has been successfully verified.' :
                                 kycStatus === 'PENDING' ? 'Verification is under review — we will notify you.' :
                                 kycStatus === 'REJECTED' ? 'Your submission was not approved. Please re-verify.' :
                                 'Required to withdraw funds and create investment projects.'}
                              </p>
                            </div>
                            {kycStatus === 'VERIFIED' ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl flex-shrink-0">
                                <CheckCircle size={13} /> Verified
                              </span>
                            ) : kycStatus === 'PENDING' ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl flex-shrink-0">
                                <Clock size={13} /> Under Review
                              </span>
                            ) : (
                              <button
                                onClick={() => router.push('/dashboard?tab=kyc')}
                                className="text-xs font-semibold px-4 py-2 rounded-xl bg-[var(--primary)] text-white hover:opacity-90 transition-all flex-shrink-0"
                              >
                                {kycStatus === 'REJECTED' ? 'Re-verify →' : 'Verify Now →'}
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      {/* Sessions */}
                      <div className="flex items-center justify-between p-5 rounded-2xl border border-[var(--border)] bg-[var(--secondary)]">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm">Active Session</p>
                          <p className="text-xs text-[var(--text-muted)]">You are signed in on this device.</p>
                        </div>
                        <button
                          onClick={() => { if (confirm('Sign out of your account?')) logout(); }}
                          className="text-xs font-semibold px-4 py-2 rounded-xl border border-[var(--border)] text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>

                    {/* Danger zone */}
                    <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-sm text-rose-500">Delete Account</p>
                        <p className="text-xs text-[var(--text-muted)]">Permanently removes your account and all data. This cannot be undone.</p>
                      </div>
                      <button
                        onClick={() => toast('To delete your account, email support@truden.tech', { icon: '⚠️', duration: 5000 })}
                        className="text-xs font-semibold px-4 py-2 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-all flex-shrink-0 ml-4"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="p-4 bg-[var(--secondary)] border border-[var(--border)] rounded-xl flex items-start gap-3">
                      <Mail size={14} className="text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        Need help? Email <strong className="text-[var(--text-main)]">support@truden.tech</strong> — we respond within 24 hours.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ── Sub-components ──

const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</label>
    {children}
  </div>
);

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative w-12 h-6 rounded-full transition-all ${checked ? 'bg-emerald-500' : 'bg-[var(--border)]'}`}
  >
    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : ''}`} />
  </button>
);

const NotifRow = ({ label, desc, checked, onChange, className = '' }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; className?: string;
}) => (
  <div className={`flex items-center justify-between ${className}`}>
    <div className="space-y-0.5 flex-1 pr-6">
      <p className="font-bold text-sm">{label}</p>
      <p className="text-xs text-[var(--text-muted)]">{desc}</p>
    </div>
    <Toggle checked={checked} onChange={() => onChange(!checked)} />
  </div>
);