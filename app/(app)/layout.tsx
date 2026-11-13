import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getServerSession } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell email={session.email} mock={session.mock}>
      {children}
    </AppShell>
  );
}
