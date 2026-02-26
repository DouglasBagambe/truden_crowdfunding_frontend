'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle, Bell } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'warning' | 'notification';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number; // ms, 0 = persistent
    sound?: boolean;
}

interface ToastContextValue {
    toasts: Toast[];
    toast: (opts: Omit<Toast, 'id'>) => string;
    success: (title: string, message?: string) => string;
    error: (title: string, message?: string) => string;
    info: (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
    notification: (title: string, message?: string) => string;
    dismiss: (id: string) => void;
    dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Sound ────────────────────────────────────────────────────
function playSound(type: ToastType) {
    if (typeof window === 'undefined') return;
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const freqMap: Record<ToastType, number> = {
            success: 880,
            error: 220,
            warning: 440,
            info: 660,
            notification: 770,
        };

        oscillator.frequency.setValueAtTime(freqMap[type], ctx.currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch {
        // ignore audio errors silently
    }
}

// ─── Icons ────────────────────────────────────────────────────
const ToastIcon = ({ type }: { type: ToastType }) => {
    const map = {
        success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
        error: <AlertCircle className="w-5 h-5 text-rose-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        notification: <Bell className="w-5 h-5 text-violet-400" />,
    };
    return map[type];
};

const borderMap: Record<ToastType, string> = {
    success: 'border-emerald-500/30',
    error: 'border-rose-500/30',
    info: 'border-blue-500/30',
    warning: 'border-amber-500/30',
    notification: 'border-violet-500/30',
};

const bgMap: Record<ToastType, string> = {
    success: 'bg-emerald-500/5',
    error: 'bg-rose-500/5',
    info: 'bg-blue-500/5',
    warning: 'bg-amber-500/5',
    notification: 'bg-violet-500/5',
};

// ─── Toast Item ───────────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    useEffect(() => {
        if (toast.sound !== false) playSound(toast.type);
    }, []);

    useEffect(() => {
        const duration = toast.duration ?? 4500;
        if (duration === 0) return;
        const timer = setTimeout(onDismiss, duration);
        return () => clearTimeout(timer);
    }, [toast.duration, onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className={`relative flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl min-w-[300px] max-w-[380px] bg-[var(--card)] ${borderMap[toast.type]} ${bgMap[toast.type]}`}
        >
            <div className="flex-shrink-0 mt-0.5">
                <ToastIcon type={toast.type} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-[var(--text-main)] leading-tight">{toast.title}</p>
                {toast.message && (
                    <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5 leading-relaxed">{toast.message}</p>
                )}
            </div>
            <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </motion.div>
    );
}

// ─── Provider ─────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const dismissAll = useCallback(() => setToasts([]), []);

    const toast = useCallback((opts: Omit<Toast, 'id'>): string => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts((prev) => [...prev.slice(-4), { ...opts, id }]); // max 5
        return id;
    }, []);

    const success = useCallback((title: string, message?: string) => toast({ type: 'success', title, message }), [toast]);
    const error = useCallback((title: string, message?: string) => toast({ type: 'error', title, message, duration: 6000 }), [toast]);
    const info = useCallback((title: string, message?: string) => toast({ type: 'info', title, message }), [toast]);
    const warning = useCallback((title: string, message?: string) => toast({ type: 'warning', title, message }), [toast]);
    const notification = useCallback((title: string, message?: string) => toast({ type: 'notification', title, message, duration: 6000 }), [toast]);

    return (
        <ToastContext.Provider value={{ toasts, toast, success, error, info, warning, notification, dismiss, dismissAll }}>
            {children}
            {/* Portal */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => (
                        <div key={t.id} className="pointer-events-auto">
                            <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
}
