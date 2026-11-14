"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { puede, ROL_LABEL, type Rol } from "@/lib/auth/roles";
import { BellIcon, BoxIcon, CashIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, HomeIcon, IdIcon, MenuIcon, ShieldIcon, TruckIcon, UsersIcon, WalletIcon } from "./icons";

// Para sumar una sección nueva, agregá una entrada acá y su página en app/(app)/<ruta>.
type IconType = (props: { className?: string }) => ReactNode;
type NavItem = { href: string; label: string; Icon: IconType; soloAdmin?: boolean; /** Etapa posterior a la que pertenece la sección. */ etapa?: 2 | 3 };

const SECTIONS: NavItem[] = [
  { href: "/", label: "Inicio", Icon: HomeIcon },
  { href: "/clientes", label: "Clientes", Icon: UsersIcon },
  { href: "/pagos", label: "Pagos", Icon: CashIcon },
  { href: "/stock", label: "Stock", Icon: BoxIcon, etapa: 2 },
  { href: "/proveedores", label: "Proveedores", Icon: TruckIcon, etapa: 2 },
  { href: "/avisos", label: "Avisos", Icon: BellIcon, etapa: 3 },
  { href: "/empleados", label: "Empleados", Icon: IdIcon, etapa: 3 },
  { href: "/gastos", label: "Gastos", Icon: WalletIcon, etapa: 3 },
  { href: "/usuarios", label: "Usuarios", Icon: ShieldIcon, soloAdmin: true },
];

const CLAVE_MENU = "carnes_rosales_menu_colapsado";
let menuEnMemoria: boolean | null = null; // por si el navegador no deja usar localStorage
const oyentes = new Set<() => void>();

function leerMenuColapsado(): boolean {
  try {
    const guardado = localStorage.getItem(CLAVE_MENU);
    if (guardado !== null) return guardado === "1";
  } catch {
    /* sin almacenamiento: se usa la memoria */
  }
  if (menuEnMemoria !== null) return menuEnMemoria;
  // Sin preferencia guardada: desplegado en computadora y plegado (solo íconos) en tablet.
  return window.matchMedia("(max-width: 1023px)").matches;
}

function guardarMenuColapsado(valor: boolean) {
  menuEnMemoria = valor;
  try {
    localStorage.setItem(CLAVE_MENU, valor ? "1" : "0");
  } catch {
    /* idem */
  }
  oyentes.forEach((avisar) => avisar());
}

function suscribirMenu(avisar: () => void) {
  oyentes.add(avisar);
  window.addEventListener("storage", avisar);
  window.addEventListener("resize", avisar);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("storage", avisar);
    window.removeEventListener("resize", avisar);
  };
}

function Marca({ compacta = false }: { compacta?: boolean }) {
  const monograma = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-accent text-sm font-bold tracking-tight text-brand-deep">
      CR
    </span>
  );
  if (compacta) return <div className="flex justify-center">{monograma}</div>;
  return (
    <div className="flex items-center gap-2.5">
      {monograma}
      <div className="leading-tight">
        <p className="text-base font-bold text-white">Carnes Rosales</p>
        <p className="text-[11px] uppercase tracking-wider text-white/60">Cuentas corrientes</p>
      </div>
    </div>
  );
}

export function AppShell({ email, rol, mock, children }: { email: string; rol: Rol; mock: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // Menú de escritorio plegado (sólo íconos). En celular se usa siempre el desplegable.
  const colapsado = useSyncExternalStore(suscribirMenu, leerMenuColapsado, () => false);
  const [tip, setTip] = useState<{ label: string; top: number; left: number } | null>(null);
  const inicial = (email.trim().charAt(0) || "U").toUpperCase();
  // La pantalla de usuarios es solo para administradores (igual se verifica en el servidor).
  const secciones = SECTIONS.filter((s) => !s.soloAdmin || puede(rol, "usuarios"));

  function mostrarTip(e: { currentTarget: HTMLElement }, label: string, siempre = false) {
    if (!colapsado && !siempre) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label, top: r.top + r.height / 2, left: r.right + 10 });
  }

  function alternarMenu() {
    setTip(null);
    guardarMenuColapsado(!colapsado);
  }

  function navLink({ href, label, Icon }: NavItem) {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setMenuOpen(false)}
        aria-current={active ? "page" : undefined}
        aria-label={colapsado ? label : undefined}
        onMouseEnter={(e) => mostrarTip(e, label)}
        onFocus={(e) => mostrarTip(e, label)}
        onMouseLeave={() => setTip(null)}
        onBlur={() => setTip(null)}
        className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors ${
          colapsado ? "md:justify-center md:gap-0 md:px-0" : ""
        } ${active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
      >
        <Icon className={`h-5 w-5 shrink-0 ${active ? "text-brand-accent" : ""}`} />
        <span className={colapsado ? "md:hidden" : ""}>{label}</span>
      </Link>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-brand-mid md:block md:h-screen md:overflow-hidden md:p-3">
      <div className="flex items-center justify-between px-4 py-3 md:hidden">
        <Marca />
        <button
          type="button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className="rounded-xl p-2 text-white hover:bg-white/15"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <div className="flex flex-1 flex-col md:h-full md:flex-row md:gap-3">
        <aside
          className={`${menuOpen ? "flex" : "hidden"} relative shrink-0 flex-col px-4 pb-4 text-white md:flex md:h-full md:p-0 md:transition-[width] md:duration-200 ${
            colapsado ? "md:w-16" : "md:w-56"
          }`}
        >
          {/* Flecha para plegar o expandir el menú (sólo escritorio). */}
          <button
            type="button"
            onClick={alternarMenu}
            onMouseEnter={(e) => mostrarTip(e, colapsado ? "Expandir" : "Contraer", true)}
            onFocus={(e) => mostrarTip(e, colapsado ? "Expandir" : "Contraer", true)}
            onMouseLeave={() => setTip(null)}
            onBlur={() => setTip(null)}
            aria-label={colapsado ? "Expandir menú" : "Contraer menú"}
            className={`absolute z-20 hidden h-7 w-7 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white md:flex ${
              colapsado ? "left-1/2 top-[66px] -translate-x-1/2" : "right-0 top-6"
            }`}
          >
            {colapsado ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
          </button>

          <div className={`hidden pt-5 md:block ${colapsado ? "px-0 pb-14" : "px-3 pb-8"}`}>
            <Marca compacta={colapsado} />
          </div>

          <nav
            aria-label="Secciones"
            className="flex-1 space-y-1 overflow-y-auto [scrollbar-color:rgba(255,255,255,0.3)_transparent] [scrollbar-width:thin]"
          >
            {secciones.filter((s) => !s.etapa).map(navLink)}

            {([2, 3] as const).map((etapa) => (
              <div key={etapa}>
                <p className={`px-2.5 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-white/60 ${colapsado ? "md:hidden" : ""}`}>
                  {etapa === 2 ? "Segunda etapa" : "Tercera etapa"}
                </p>
                {colapsado && <div aria-hidden className="mx-2 my-3 hidden border-t border-white/20 md:block" />}
                <div className="space-y-1">{secciones.filter((s) => s.etapa === etapa).map(navLink)}</div>
              </div>
            ))}
          </nav>

          <div
            className={`mt-2 flex items-center gap-2 border-t border-white/20 px-2 pt-4 ${
              colapsado ? "md:flex-col md:px-0" : ""
            }`}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-accent text-sm font-bold text-brand-deep"
              title={colapsado ? `${email} · ${ROL_LABEL[rol]}` : undefined}
            >
              {inicial}
            </span>
            <div className={`min-w-0 flex-1 ${colapsado ? "md:hidden" : ""}`}>
              <p className="truncate text-[13px] font-semibold leading-tight">
                {ROL_LABEL[rol]}
                {mock && " · demo"}
              </p>
              <p className="truncate text-xs text-white/75" title={email}>
                {email}
              </p>
            </div>
            <LogoutButton />
          </div>
        </aside>

        {/* Nombre de la sección al pasar el mouse con el menú plegado. */}
        {tip && (
          <span
            role="tooltip"
            style={{ top: tip.top, left: tip.left }}
            className="pointer-events-none fixed z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-brand-deep px-2.5 py-1.5 text-xs font-medium text-white shadow-lg ring-1 ring-brand-accent/50 md:block"
          >
            {tip.label}
          </span>
        )}

        <main className="min-w-0 flex-1 rounded-t-3xl bg-slate-50 px-4 py-6 [scrollbar-color:#c3c6ea_transparent] [scrollbar-width:thin] md:h-full md:overflow-y-auto md:rounded-3xl md:py-8 md:pl-8 md:pr-4">
          {mock && (
            <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Modo demo: Supabase no está configurado. Los datos son de ejemplo y lo que cargues se pierde al reiniciar.
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
