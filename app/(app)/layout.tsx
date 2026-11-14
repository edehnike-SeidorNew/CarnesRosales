import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { exigirAcceso } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await exigirAcceso();

  return (
    <AppShell email={session.email} rol={session.rol} mock={session.mock}>
      {children}
    </AppShell>
  );
}
