"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, CircleAlert, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import {
  markAllNotificationsRead,
  markNotificationRead,
  getNotifications,
  type KeiboNotification,
  type NotificationCategory,
} from "@/lib/notification-service";

const filters: Array<{ label: string; value?: NotificationCategory }> = [
  { label: "All" },
  { label: "Campaign", value: "campaign" },
  { label: "Financial", value: "financial" },
  { label: "System", value: "system" },
  { label: "Security", value: "security" },
];

export function NotificationsView() {
  const [items, setItems] = useState<KeiboNotification[]>([]);
  const [category, setCategory] = useState<NotificationCategory | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (nextCategory?: NotificationCategory) => {
    setLoading(true);
    setError(false);
    try {
      setItems(await getNotifications(nextCategory));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load(category);
  }, [category, load]);
  const unread = items.filter((item) => !item.readAt).length;
  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((current) =>
        current.map((item) => ({
          ...item,
          readAt: item.readAt || new Date().toISOString(),
        })),
      );
    } catch {
      toast.error("Unable to mark notifications as read. Try again.");
    }
  };
  const read = async (item: KeiboNotification) => {
    if (!item.readAt) {
      try {
        await markNotificationRead(item.id);
        setItems((current) =>
          current.map((candidate) =>
            candidate.id === item.id
              ? { ...candidate, readAt: new Date().toISOString() }
              : candidate,
          ),
        );
      } catch {
        toast.error("Unable to mark this notification as read. Try again.");
      }
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Account activity</p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            <Bell size={20} className="text-[var(--primary)]" />
            Notifications
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {unread
              ? `${unread} unread update${unread === 1 ? "" : "s"}`
              : "You are up to date"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="button_secondary gap-2"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          {unread > 0 && (
            <button
              className="button_secondary gap-2"
              onClick={() => void markAll()}
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
        </div>
      </header>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <button
            key={filter.label}
            className={`rounded-md px-3 py-2 text-sm font-medium ${category === filter.value ? "bg-[var(--primary)] text-white" : "border border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
            onClick={() => setCategory(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className="card_base overflow-hidden p-0">
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((key) => (
              <div
                key={key}
                className="h-14 animate-pulse rounded bg-[var(--secondary)]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 p-5 text-sm text-[var(--text-muted)]">
            <CircleAlert className="mt-0.5 text-amber-600" size={18} />
            Notifications could not be loaded. Try again shortly.
          </div>
        ) : items.length ? (
          <ul className="divide-y divide-[var(--border)]">
            {items.map((item) => (
              <li
                key={item.id}
                className={`flex gap-3 px-5 py-4 ${item.readAt ? "" : "bg-[var(--primary)]/[0.035]"}`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-transparent" : "bg-[var(--primary)]"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">{item.title}</p>
                    <time className="text-xs text-[var(--text-muted)]">
                      {new Intl.DateTimeFormat("en-UG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.createdAt))}
                    </time>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                    {item.body}
                  </p>
                  <div className="mt-2 flex gap-3">
                    {item.link && (
                      <Link
                        href={item.link}
                        onClick={() => void read(item)}
                        className="text-xs font-semibold text-[var(--primary)]"
                      >
                        View details
                      </Link>
                    )}
                    {!item.readAt && (
                      <button
                        className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        onClick={() => void read(item)}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-12 text-center">
            <Bell className="mx-auto text-[var(--text-muted)]" size={22} />
            <p className="mt-3 text-sm font-medium">No notifications</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Campaign, financial, and account updates will appear here when
              they are recorded.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
