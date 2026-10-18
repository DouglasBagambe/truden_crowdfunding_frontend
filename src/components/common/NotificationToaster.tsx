"use client";

import { Toaster, ToastBar, toast } from "react-hot-toast";

export function NotificationToaster() {
  return (
    <Toaster position="top-right" toastOptions={{ duration: 6000 }}>
      {(notification) => (
        <ToastBar toast={notification}>
          {({ icon, message }) => (
            <>
              {icon}
              <div className="min-w-0 break-words">{message}</div>
              {notification.type !== "loading" && (
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => toast.remove(notification.id)}
                  className="pointer-events-auto shrink-0 p-2"
                >
                  ×
                </button>
              )}
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
