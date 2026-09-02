"use client";

import { Bell } from "lucide-react";
import { motion } from "framer-motion";

export function NotificationsView() {
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
      </div>

      <div className="space-y-3">
        <div className="py-24 text-center space-y-4 bg-[var(--card)] border border-[var(--border)] rounded-3xl border-dashed">
          <div className="w-16 h-16 bg-[var(--secondary)] rounded-2xl flex items-center justify-center mx-auto opacity-50">
            <Bell className="text-[var(--text-muted)]" size={24} />
          </div>
          <p className="font-bold text-[var(--text-main)]">
            Notifications are unavailable
          </p>
          <p className="mx-auto max-w-md text-sm text-[var(--text-muted)]">
            KEIBO will enable notifications only after durable delivery and
            read-state APIs are connected.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
