"use client";
// Compatibility adapter: all active notifications share one mounted renderer.
import { createContext, useCallback, useContext, type ReactNode } from "react";
import toast from "react-hot-toast";
type Notification = {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
};
function showToast(value: Notification) {
  return toast(
    value.message ? `${value.title}: ${value.message}` : value.title,
    { duration: value.duration ?? 5000 },
  );
}
const Context = createContext<ReturnType<typeof useNotificationActions> | null>(
  null,
);
function useNotificationActions() {
  const showSuccess = useCallback(
    (title: string, message?: string) =>
      showToast({ type: "success", title, message }),
    [],
  );
  const showError = useCallback(
    (title: string, message?: string) =>
      showToast({ type: "error", title, message }),
    [],
  );
  const showWarning = useCallback(
    (title: string, message?: string) =>
      showToast({ type: "warning", title, message }),
    [],
  );
  const showInfo = useCallback(
    (title: string, message?: string) =>
      showToast({ type: "info", title, message }),
    [],
  );
  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast: toast.remove,
  };
}
export function ToastProvider({ children }: { children: ReactNode }) {
  const actions = useNotificationActions();
  return <Context.Provider value={actions}>{children}</Context.Provider>;
}
export function useToast() {
  const value = useContext(Context);
  if (!value) throw new Error("useToast must be used within ToastProvider");
  return value;
}
