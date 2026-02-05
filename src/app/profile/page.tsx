'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { 
  Wallet, User, ShieldCheck, Mail, ShieldAlert, 
  ExternalLink, Copy, Check, Power, Bell, 
  Trash2, PlusCircle, BadgeCheck
} from 'lucide-react';
import { userService } from '@/lib/user-service';
import KYCModal from '@/components/dashboard/KYCModal';
import { useAccount, useSignMessage } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { SiweMessage } from 'siwe';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const [copied, setCopied] = useState('');
  const [isKYCOpen, setIsKYCOpen] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { open } = useWeb3Modal();

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
        chainId: 1, 
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

  return (
    <div className="pt-24 bg-background min-h-screen text-foreground">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 pb-24">
        <header className="mb-12 space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-gray-500 font-medium">Manage your identity, security, and linked wallets.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Identity & Security */}
            <div className="lg:col-span-2 space-y-8">
                {/* Profile Card */}
                <section className="glass-card rounded-[2.5rem] p-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-500/20">
                                <span className="text-white text-3xl font-bold">
                                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">{user?.firstName} {user?.lastName}</h2>
                                <p className="text-gray-500 font-medium">{user?.email}</p>
                            </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user?.kycStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {user?.kycStatus || 'Not Verified'}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-gray-100 dark:border-slate-800">
                        <ProfileInfo icon={<Mail />} label="Email Address" value={user?.email} />
                        <ProfileInfo icon={<User />} label="Account Type" value={user?.roles?.join(', ') || 'Investor'} />
                    </div>
                </section>

                {/* Wallets Section */}
                <section className="glass-card rounded-[2.5rem] p-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Wallet className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-xl font-bold">Connected Wallets</h3>
                        </div>
                        <button 
                            onClick={handleLinkWallet}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 transition-all text-xs"
                        >
                            <PlusCircle className="w-4 h-4" />
                            Link New Wallet
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Primary Wallet */}
                        {user?.primaryWallet && (
                            <WalletItem 
                                address={user.primaryWallet} 
                                isPrimary 
                                onCopy={() => copyToClipboard(user.primaryWallet, 'primary')}
                                isCopied={copied === 'primary'}
                            />
                        )}

                        {/* Linked Wallets */}
                        {user?.linkedWallets?.map((wallet: string, idx: number) => (
                            <WalletItem 
                                key={idx}
                                address={wallet} 
                                onCopy={() => copyToClipboard(wallet, `linked-${idx}`)}
                                isCopied={copied === `linked-${idx}`}
                                onUnlink={() => handleUnlink(wallet)}
                            />
                        ))}

                        {(!user?.linkedWallets || user.linkedWallets.length === 0) && !user?.primaryWallet && (
                            <div className="py-12 text-center bg-gray-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-slate-800">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No wallets linked</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Right: Security & Actions */}
            <div className="space-y-8">
                {/* KYC Integrity */}
                <section className={`p-8 rounded-[2.5rem] border-2 transition-all ${user?.kycStatus === 'VERIFIED' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' : 'bg-slate-50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800'}`}>
                    <ShieldCheck className={`w-10 h-10 mb-6 ${user?.kycStatus === 'VERIFIED' ? 'text-emerald-500' : 'text-gray-400'}`} />
                    <h3 className="text-lg font-bold mb-2">Identity Shield</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-6">
                        Verify your identity to unlock global investment opportunities and higher capital limits.
                    </p>
                    
                    {user?.kycStatus === 'VERIFIED' ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                            <BadgeCheck className="w-4 h-4" />
                            Fully Verified
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsKYCOpen(true)}
                            className="w-full bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-bold py-3 rounded-2xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-sm"
                        >
                            Complete Verification
                        </button>
                    )}
                </section>

                <button 
                    onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-all active:scale-[0.98]"
                >
                    <Power className="w-4 h-4" />
                    Secure Logout
                </button>
            </div>
        </div>
      </main>

      <KYCModal isOpen={isKYCOpen} onClose={() => setIsKYCOpen(false)} />
      <Footer />
    </div>
  );
}

const ProfileInfo = ({ icon, label, value }: any) => (
    <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-2xl text-gray-400">
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' }) : icon}
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
            <p className="font-bold text-gray-700 dark:text-gray-200">{value || 'Not set'}</p>
        </div>
    </div>
);

const WalletItem = ({ address, isPrimary, onCopy, isCopied, onUnlink }: any) => (
    <div className="group flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl hover:shadow-md transition-all">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPrimary ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>
                <Wallet className="w-5 h-5" />
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-bold dark:text-white">{address.slice(0, 8)}...{address.slice(-6)}</p>
                    {isPrimary && <span className="text-[8px] bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest">Primary</span>}
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Standard Wallet Hub</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={onCopy}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-gray-400"
            >
                {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            {!isPrimary && (
                <button 
                    onClick={onUnlink}
                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors text-gray-400 group-hover:text-rose-500"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    </div>
);
