import { GuestGuard } from "@/components/auth/GuestGuard";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestGuard>{children}</GuestGuard>;
}
