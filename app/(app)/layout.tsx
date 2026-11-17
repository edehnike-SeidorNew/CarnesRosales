import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { NotificacionesProvider } from "@/components/ui/Notificaciones";
import { exigirAcceso } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await exigirAcceso();

  return (
    <NotificacionesProvider>
      <AppShell email={session.email} rol={session.rol} mock={session.mock}>
        {children}
      </AppShell>
    </NotificacionesProvider>
  );
}
