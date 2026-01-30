import { GuestGuard } from "@/components/auth/GuestGuard";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestGuard>{children}</GuestGuard>;
}
