'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import {
  Wallet, User, ShieldCheck, Mail, Bell,
  HelpCircle, Lock, Settings as SettingsIcon, CreditCard
} from 'lucide-react';
import { userService } from '@/lib/user-service';
import KYCModal from '@/components/dashboard/KYCModal';
import { useAccount, useSignMessage, useChainId } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { SiweMessage } from 'siwe';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export default function ProfilePage() {
  const router = useRouter();
  const { user, refetchUser, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isKYCOpen, setIsKYCOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Profile Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { open } = useWeb3Modal();
  const chainId = useChainId();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (user) {
      const p = user.profile || {};
      let fn = p.firstName || user.firstName || '';
      let ln = p.lastName || user.lastName || '';
      const dn = p.displayName || user.displayName || '';

      // Fallback: If names are blank but we have a display name that isn't the email
      if (!fn && !ln && dn && dn !== user.email) {
        if (dn.includes(' ')) {
          const parts = dn.split(' ');
          fn = parts[0];
          ln = parts.slice(1).join(' ');
        } else {
          fn = dn;
          ln = '';
        }
      }

      setFirstName(fn || '');
      setLastName(ln || '');
      setEmail(user.email || '');
    }
  }, [isLoading, isAuthenticated, router, user]);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const updateData: any = {};
      const actualFirstName = user?.profile?.firstName || user?.firstName;
      const actualLastName = user?.profile?.lastName || user?.lastName;

      if (firstName !== actualFirstName) updateData.firstName = firstName;
      if (lastName !== actualLastName) updateData.lastName = lastName;
      if (email !== user?.email) updateData.email = email;
      if (password) updateData.password = password;

      if (Object.keys(updateData).length === 0) {
        toast.success("No changes to save");
        setIsSaving(false);
        return;
      }

      await userService.updateProfile(updateData);
      toast.success("Profile updated successfully");
      refetchUser();
      setPassword(''); // clear password field
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!isConnected) {
      open();
      return;
    }

    if (!address) return;

    const alreadyLinked = user?.primaryWallet === address.toLowerCase() ||
      user?.linkedWallets?.includes(address.toLowerCase());

    if (alreadyLinked) {
      toast.error("This wallet is already linked to your account");
      return;
    }

    const tId = toast.loading("Preparing signature request...");
    try {
      const nonce = await userService.getSiweNonce(address);
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: address,
        statement: 'Link this wallet to your Keibo account',
        uri: window.location.origin,
        version: '1',
        chainId: chainId || 1,
        nonce: nonce,
      });

      const message = siweMessage.prepareMessage();
      const signature = await signMessageAsync({ message });

      await userService.linkWallet({
        wallet: address,
        message,
        signature
      });

      toast.success("Wallet linked successfully", { id: tId });
      refetchUser();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "Failed to link wallet", { id: tId });
    }
  };

  const handleUnlink = async (walletAddress: string) => {
    if (confirm(`Unlink wallet ${walletAddress.slice(0, 6)}...?`)) {
      try {
        await userService.unlinkWallet(walletAddress);
        toast.success("Wallet unlinked");
        refetchUser();
      } catch (e: any) {
        toast.error(e.response?.data?.message || "Failed to unlink");
      }
    }
  };

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className="pt-24 bg-[var(--background)] min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pb-24">
        {isLoading ? (
          <div className="h-48 bg-[var(--card)] rounded-2xl border border-[var(--border)] animate-pulse" />
        ) : (
          <div className="grid grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="col-span-3">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-2">
                <h2 className="text-sm font-semibold text-[var(--text-main)] px-4 py-3">Settings</h2>
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id
                          ? 'bg-[var(--secondary)] text-[var(--text-main)]'
                          : 'text-[var(--text-muted)] hover:bg-[var(--secondary)]'
                          }`}
                      >
                        <Icon size={18} />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="col-span-9">
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">Profile</h1>
                    <p className="text-[var(--text-muted)]">Manage your personal information and preferences.</p>
                  </div>

                  {/* Profile Picture */}
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--text-main)]">Profile Picture</h3>
                    <div className="flex items-start gap-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">
                          {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-[var(--text-main)] mb-1">Change Profile Picture</h4>
                        <p className="text-sm text-[var(--text-muted)] mb-4">Upload a new photo to personalize your profile.</p>
                      </div>
                    </div>
                  </section>

                  {/* Personal Information */}
                  <section className="space-y-6">
                    <h3 className="text-lg font-semibold text-[var(--text-main)]">Personal Information</h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-main)] mb-2">First Name</label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--secondary)] border border-[var(--border)] rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-main)] mb-2">Last Name</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--secondary)] border border-[var(--border)] rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-main)] mb-2">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-[var(--secondary)] border border-[var(--border)] rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-main)] mb-2">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Leave blank to keep unchanged"
                            className="w-full px-4 py-3 bg-[var(--secondary)] border border-[var(--border)] rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] pr-12"
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                          >
                            {showPassword ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Social Media Links */}
                  {/* <section className="space-y-6">
                    <h3 className="text-lg font-semibold text-[var(--text-main)]">Social Media Links</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-main)] mb-2">X</label>
                        <input
                          type="text"
                          placeholder="https://x.com/username"
                          className="w-full px-4 py-3 bg-[var(--secondary)] border border-[var(--border)] rounded-xl text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-main)] mb-2">LinkedIn</label>
                        <input
                          type="text"
                          placeholder="https://linkedin.com/in/username"
                          className="w-full px-4 py-3 bg-[var(--secondary)] border border-[var(--border)] rounded-xl text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                      </div>
                    </div>
                  </section> */}

                  {/* Save Button */}
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">Preferences</h1>
                    <p className="text-[var(--text-muted)]">Personalize how Keibo looks and feels.</p>
                  </div>

                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
                    <div className="flex items-center justify-between gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--text-main)]">Theme mode</h3>
                        <p className="text-sm text-[var(--text-muted)]">Switch between light and dark mode.</p>
                      </div>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
              )}





              {activeTab === 'help' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">Help & Support</h1>
                    <p className="text-[var(--text-muted)]">Get assistance with your account and projects.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)]/30 transition-all cursor-pointer">
                      <Mail className="w-8 h-8 text-[var(--primary)] mb-4" />
                      <h3 className="text-lg font-bold mb-2">Contact Support</h3>
                      <p className="text-sm text-[var(--text-muted)]">Send us an email directly to resolve any major account issues.</p>
                    </div>
                    <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)]/30 transition-all cursor-pointer">
                      <HelpCircle className="w-8 h-8 text-[var(--primary)] mb-4" />
                      <h3 className="text-lg font-bold mb-2">FAQ Database</h3>
                      <p className="text-sm text-[var(--text-muted)]">Browse our knowledge base for quick answers and guides.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <KYCModal isOpen={isKYCOpen} onClose={() => setIsKYCOpen(false)} />
      <Footer />
    </div>
  );
}