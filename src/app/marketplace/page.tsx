import Link from "next/link";
import { Ban } from "lucide-react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] pt-24">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <Ban className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-6 text-3xl font-black text-[var(--text-main)]">Marketplace unavailable</h1>
        <p className="mt-3 leading-7 text-[var(--text-muted)]">KEIBO investment receipts are non-transferable and cannot be listed for resale.</p>
        <Link href="/dashboard" className="mt-8 inline-block font-bold text-[var(--primary)]">Return to dashboard</Link>
      </main>
      <Footer />
    </div>
  );
}
