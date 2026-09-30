import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { NotificationsView } from "@/components/dashboard/NotificationsView";

export default function NotificationsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] pt-[68px]">
      <Navbar />
      <main className="page-shell flex-1 py-8 sm:py-12">
        <NotificationsView />
      </main>
      <Footer />
    </div>
  );
}
