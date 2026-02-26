'use client';

import { Bell, Clock, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export function NotificationsView() {
    // This would ideally fetch from a notification service
    const notifications = [
        {
            id: '1',
            title: 'Welcome to TruFund!',
            message: 'Start your journey by exploring innovative projects in Uganda.',
            type: 'info',
            time: '2 hours ago',
            read: false
        },
        {
            id: '2',
            title: 'KYC Tip',
            message: 'Complete your identity verification to unlock higher investment limits.',
            type: 'warning',
            time: '5 hours ago',
            read: true
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Bell size={20} className="text-blue-500" />
                    Latest Updates
                </h3>
                <button className="text-xs font-black uppercase tracking-widest text-[var(--primary)] hover:underline">
                    Mark all as read
                </button>
            </div>

            <div className="space-y-3">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`p-5 rounded-2xl border transition-all flex gap-4 ${n.read ? 'bg-[var(--card)] border-[var(--border)] opacity-70' : 'bg-blue-500/5 border-blue-500/20 shadow-sm'}`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                            {n.type === 'warning' ? <AlertTriangle size={18} /> : <Bell size={18} />}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <p className="font-bold text-[var(--text-main)]">{n.title}</p>
                                <span className="text-[10px] font-bold text-[var(--text-muted)]">{n.time}</span>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">{n.message}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
                    </div>
                ))}

                {notifications.length === 0 && (
                    <div className="py-24 text-center space-y-4 bg-[var(--card)] border border-[var(--border)] rounded-3xl border-dashed">
                        <div className="w-16 h-16 bg-[var(--secondary)] rounded-2xl flex items-center justify-center mx-auto opacity-50">
                            <Bell className="text-[var(--text-muted)]" size={24} />
                        </div>
                        <p className="text-[var(--text-muted)] font-medium">You're all caught up!</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
