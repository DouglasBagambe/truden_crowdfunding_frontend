import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { AuthSyncProvider } from "@/providers/AuthSyncProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ToastProvider } from "@/components/common/ToastProvider";
import { BlockchainEventMonitor } from "@/components/common/BlockchainEventMonitor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TruFund | Decentralized Crowdfunding",
  description: "Secure, transparent, and borderless funding for global innovation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased selection:bg-blue-100 selection:text-blue-900`}>
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
