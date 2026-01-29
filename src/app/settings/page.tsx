'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { 
  User, Wallet, Shield, Bell, 
  Moon, Sun, Copy, 
  Trash2, PlusCircle
} from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('Profile');

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success('Address copied');
  };

  const tabs = [
    { name: 'Profile', icon: <User size={18} /> },
    { name: 'Wallets', icon: <Wallet size={18} /> },
    { name: 'Security', icon: <Shield size={18} /> },
    { name: 'Notifications', icon: <Bell size={18} /> },
    { name: 'Appearance', icon: <Sun size={18} /> },
  ];

  return (
    <div className="bg-[var(--background)] min-h-screen text-[var(--text-main)] pt-[72px] transition-colors duration-300">
      <Navbar />
      
      <main className="container mx-auto px-6 py-12 lg:px-10">
        <div className="max-w-5xl mx-auto space-y-10">
          <header className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-[var(--text-muted)] font-medium">Manage your TruFund profile and security preferences.</p>
          </header>

          <div className="flex border-b border-gray-200 dark:border-[#262626] overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.name 
                  ? 'border-[var(--primary)] text-[var(--primary)]' 
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
                <h3 className="text-xl font-bold">{activeTab}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">
                    {activeTab === 'Profile' && 'Configure how you appear to other innovators and backers.'}
                    {activeTab === 'Wallets' && 'Manage your connected blockchain addresses for funding.'}
                    {activeTab === 'Security' && 'Enhance your security with two-factor authentication.'}
                    {activeTab === 'Appearance' && 'Choose between light or dark mode interface.'}
                    {activeTab === 'Notifications' && 'Stay updated on project launches and milestones.'}
                </p>
            </div>

            <div className="md:col-span-2 space-y-8">
              {activeTab === 'Profile' && (
                <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#262626] p-8 space-y-6 shadow-sm">
                    <div className="grid grid-cols-1 gap-6">
                        <InputGroup label="Full Name" placeholder="Your name" defaultValue={(user?.firstName || "") + " " + (user?.lastName || "")} />
                        <InputGroup label="Email Address" placeholder="email@example.com" defaultValue={user?.email} disabled />
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Creator Bio</label>
                            <textarea className="input_field h-32 resize-none" placeholder="Tell the community about your mission..." />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button className="button_primary px-10">Update Profile</button>
                    </div>
                </div>
              )}

              {activeTab === 'Wallets' && (
                <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#262626] p-8 space-y-6 shadow-sm">
                    <h4 className="font-bold">Funding Sources</h4>
                    <div className="space-y-4">
                        {user?.primaryWallet ? (
                            <WalletRow 
                                address={user.primaryWallet} 
                                isPrimary 
                                onCopy={() => copyAddress(user.primaryWallet)} 
                            />
                        ) : (
                            <p className="text-sm text-[var(--text-muted)] italic">No wallets connected to this account.</p>
                        )}
                        <button className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 dark:border-[#262626] rounded-xl text-[var(--primary)] font-bold hover:bg-[var(--secondary)] transition-colors mt-4">
                            <PlusCircle size={18} />
                            LINK NEW WALLET
                        </button>
                    </div>
                </div>
              )}

              {activeTab === 'Appearance' && (
                <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#262626] p-8 space-y-8 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-[var(--text-main)]">Interface Mode</h4>
                            <p className="text-sm text-[var(--text-muted)] font-medium">Toggle between professional light and dark themes.</p>
                        </div>
                        <ThemeToggle />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <button 
                            onClick={() => setTheme('light')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-3 ${theme === 'light' ? 'border-[var(--primary)] bg-[var(--secondary)]' : 'border-gray-100 dark:border-[#262626] hover:bg-gray-50'}`}
                        >
                            <div className="w-full h-16 bg-white rounded-lg shadow-inner flex items-center justify-center border border-gray-200">
                                <Sun className="text-yellow-500" />
                            </div>
                            <span className="text-xs font-bold text-center">LIGHT MODE</span>
                        </button>
                        <button 
                             onClick={() => setTheme('dark')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-3 ${theme === 'dark' ? 'border-[var(--primary)] bg-[#1a1a1a]' : 'border-gray-100 dark:border-[#262626] hover:bg-gray-50'}`}
                        >
                            <div className="w-full h-16 bg-[#0d0d0d] rounded-lg shadow-inner flex items-center justify-center border border-[#262626]">
                                <Moon className="text-blue-400" />
                            </div>
                            <span className="text-xs font-bold text-center">DARK MODE</span>
                        </button>
                    </div>
                </div>
              )}

              {activeTab === 'Security' && (
                <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#262626] p-8 space-y-8 shadow-sm">
                     <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold">Two-Factor Authentication</h4>
                            <p className="text-sm text-[var(--text-muted)] font-medium">Adds an extra layer of security to your account.</p>
                        </div>
                        <SimpleSwitch checked={!!user?.mfaEnabled} />
                    </div>
                    <div className="border-t border-gray-200 dark:border-[#262626] pt-8 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold">Change Password</h4>
                            <p className="text-sm text-[var(--text-muted)] font-medium">Last changed 3 months ago.</p>
                        </div>
                        <button className="button_secondary py-2 text-xs">Update</button>
                    </div>
                </div>
              )}

              {activeTab === 'Notifications' && (
                <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#262626] p-8 space-y-8 shadow-sm">
                    <NotificationItem label="Investment Alerts" desc="Email updates for your contributions." checked />
                    <NotificationItem label="Project Milestones" desc="Get notified when targets are met." checked />
                    <NotificationItem label="Marketing & Tips" desc="New opportunities from the TruFund network." />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-10 border-t border-gray-200 dark:border-[#262626]">
                <button 
                    onClick={() => logout()}
                    className="flex items-center gap-2 text-rose-500 font-bold text-sm tracking-tight hover:underline"
                >
                    <Trash2 size={16} />
                    Delete Account Permanently
                </button>
                <button className="button_primary px-12 focus:ring-offset-2">Save All Changes</button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

const InputGroup = ({ label, ...props }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">{label}</label>
        <input className="input_field" {...props} />
    </div>
);

const WalletRow = ({ address, isPrimary, onCopy }: any) => (
    <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-[#0d0d0d] rounded-2xl border border-gray-200 dark:border-[#262626] hover:border-[var(--primary)] transition-all group">
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl border ${isPrimary ? 'bg-[var(--primary)] text-white border-transparent' : 'bg-white dark:bg-[#1a1a1a] text-[var(--text-muted)] border-gray-200 dark:border-[#333]'}`}>
                <Wallet size={18} />
            </div>
            <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                    <p className="font-bold text-sm tracking-tight">{address.slice(0, 10)}...{address.slice(-8)}</p>
                    {isPrimary && <span className="text-[8px] font-black uppercase tracking-widest bg-[var(--secondary)] text-[var(--primary)] px-2 py-0.5 rounded">Primary</span>}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Connected via MetaMask</p>
            </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={onCopy} className="p-2 hover:bg-white dark:hover:bg-[#1a1a1a] rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-[#333] transition-all"><Copy size={16} /></button>
            <button className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg transition-all"><Trash2 size={16} /></button>
        </div>
    </div>
);

const SimpleSwitch = ({ checked }: { checked: boolean }) => (
    <label className="relative flex h-[30px] w-[50px] cursor-pointer items-center rounded-full border-2 border-gray-200 dark:border-[#333] bg-gray-100 dark:bg-[#1a1a1a] p-0.5 has-[:checked]:justify-end has-[:checked]:bg-emerald-500 has-[:checked]:border-transparent transition-all">
        <div className="h-full w-[22px] rounded-full bg-white shadow-sm transition-all" />
        <input className="invisible absolute" type="checkbox" defaultChecked={checked} />
    </label>
);

const NotificationItem = ({ label, desc, checked }: any) => (
    <div className="flex items-center justify-between">
        <div className="space-y-0.5">
            <h4 className="font-bold text-sm">{label}</h4>
            <p className="text-xs text-[var(--text-muted)] font-medium">{desc}</p>
        </div>
        <SimpleSwitch checked={checked} />
    </div>
);
