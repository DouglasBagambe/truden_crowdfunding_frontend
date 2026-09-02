import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { AuthSyncProvider } from "@/providers/AuthSyncProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ToastProvider } from "@/components/common/ToastProvider";
import { BlockchainEventMonitor } from "@/components/common/BlockchainEventMonitor";

export const metadata: Metadata = {
  title: "KEIBO | Crowdfunding",
  description: "Campaign funding with verified payment and milestone records.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-blue-100 selection:text-blue-900">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Web3Provider>
            <AuthSyncProvider>
              <ToastProvider>
                <BlockchainEventMonitor />
                {children}
              </ToastProvider>
            </AuthSyncProvider>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
