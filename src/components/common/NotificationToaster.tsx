"use client";

import { Toaster } from "react-hot-toast";

export function NotificationToaster() {
  return <Toaster position="top-right" toastOptions={{ duration: 6000 }} />;
}
