import type { ReactNode } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export function PublicPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] pt-[68px] text-[var(--text-main)]">
      <Navbar />
      <main className="page-shell flex-1 py-12 sm:py-16">
        <div className="max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <div className="mt-8 space-y-5 text-[15px] leading-7 text-[var(--text-muted)]">
            {children}
          </div>
          <Link href="/" className="button_secondary mt-9">
            Return home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
