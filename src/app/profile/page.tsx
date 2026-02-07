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

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { open } = useWeb3Modal();
  const chainId = useChainId();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

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
        statement: 'Link this wallet to your TruFund account',
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
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'wallet', label: 'Wallet Information', icon: CreditCard },
    { id: 'legal', label: 'Legal,Disclaimer & KYC Notice', icon: Lock },
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
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                          activeTab === item.id
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
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-main)] mb-2">Name</label>
                        <input
                          type="text"
                          defaultValue={`${user?.firstName || ''} ${user?.lastName || ''}`}
                          className="w-full px-4 py-3 bg-[var(--secondary)] border border-[var(--border)] rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-main)] mb-2">Email</label>
                        <input
                          type="email"
                          defaultValue={user?.email || ''}
                          className="w-full px-4 py-3 bg-[var(--secondary)] border border-[var(--border)] rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-main)] mb-2">Password</label>
                        <div className="relative">
                          <input
                            type="password"
                            defaultValue="••••••••"
                            className="w-full px-4 py-3 bg-[var(--secondary)] border border-[var(--border)] rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          />
                          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
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
                  <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
                    Save Changes
                  </button>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">Preferences</h1>
                    <p className="text-[var(--text-muted)]">Personalize how TruFund looks and feels.</p>
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

              {activeTab === 'wallet' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">Wallet Information</h1>
                    <p className="text-[var(--text-muted)]">Manage your connected wallets and transactions.</p>
                  </div>

                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-6">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-main)]">Wallet status</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {isConnected && address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : 'No wallet connected'}
                        </p>
                      </div>
                      <button
                        onClick={handleLinkWallet}
                        className="bg-[var(--primary)] hover:opacity-90 text-white font-semibold px-5 py-2.5 rounded-xl transition-all"
                      >
                        Link Wallet
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {user?.primaryWallet && (
                      <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                              <Wallet className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--text-main)]">{user.primaryWallet.slice(0, 8)}...{user.primaryWallet.slice(-6)}</p>
                              <p className="text-sm text-[var(--text-muted)]">Primary Wallet</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-semibold rounded-full">
                            PRIMARY
                          </span>
                        </div>
                      </div>
                    )}

                    {user?.linkedWallets?.map((wallet: string, idx: number) => (
                      <div key={idx} className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[var(--secondary)] rounded-xl flex items-center justify-center">
                              <Wallet className="w-6 h-6 text-[var(--text-muted)]" />
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--text-main)]">{wallet.slice(0, 8)}...{wallet.slice(-6)}</p>
                              <p className="text-sm text-[var(--text-muted)]">Linked Wallet</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnlink(wallet)}
                            className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            Unlink
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={handleLinkWallet}
                      className="w-full p-6 bg-[var(--secondary)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)] transition-colors text-left"
                    >
                      <p className="text-[var(--text-main)] font-semibold">+ Link another wallet</p>
                      <p className="text-sm text-[var(--text-muted)] mt-1">You’ll sign a message to verify wallet ownership.</p>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'legal' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">KYC Verification</h1>
                    <p className="text-[var(--text-muted)]">Complete your identity verification to unlock all features.</p>
                  </div>

                  <div className="p-8 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                    {user?.kycStatus === 'VERIFIED' ? (
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                          <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-main)]">Verified</h3>
                        <p className="text-[var(--text-muted)]">Your identity has been successfully verified.</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto">
                          <ShieldCheck className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-main)]">Not Verified</h3>
                        <p className="text-[var(--text-muted)]">Complete your KYC verification to access all features.</p>
                        <button
                          onClick={() => setIsKYCOpen(true)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
                        >
                          Start Verification
                        </button>
                      </div>
                    )}
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