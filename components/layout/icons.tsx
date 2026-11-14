import type { ReactNode } from "react";

function Svg({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-5 w-5"}
    >
      {children}
    </svg>
  );
}

type IconProps = { className?: string };

export const MenuIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Svg>
);

export const CloseIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const ChevronLeftIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m15 6-6 6 6 6" />
  </Svg>
);

export const ChevronRightIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);

export const UsersIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M16 3.1a4 4 0 0 1 0 7.8M21 21v-2a4 4 0 0 0-3-3.9" />
  </Svg>
);

export const UserPlusIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 20a7 7 0 0 1 14 0M19 8v6M16 11h6" />
  </Svg>
);

export const HistoryIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 8v4l2 2" />
    <path d="M3.05 11a9 9 0 1 1 .5 4M3 4v7h7" />
  </Svg>
);

export const CashIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3 7h18v10H3z" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M7 12h.01M17 12h.01" />
  </Svg>
);

/** Remito / venta. */
export const ReceiptIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
    <path d="M9 8h6M9 12h6" />
  </Svg>
);

export const PlusIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const TrashIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </Svg>
);

export const RefreshIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4" />
    <path d="M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4" />
  </Svg>
);

export const LogoutIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" />
    <path d="M9 12h12l-3-3M18 15l3-3" />
  </Svg>
);

export const HomeIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9" />
  </Svg>
);

export const ScaleIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 4v16M7 20h10M5 7h14" />
    <path d="M5 7 2.5 13a2.6 2.6 0 0 0 5 0zM19 7l-2.5 6a2.6 2.6 0 0 0 5 0z" />
  </Svg>
);

/** Embudo de filtros. */
export const FunnelIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 5h16l-6.2 7.4V18l-3.6 2v-7.6z" />
  </Svg>
);

export const PencilIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
    <path d="m13.5 6.5 4 4" />
  </Svg>
);

export const DownloadIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 4v12M7 11l5 5 5-5" />
    <path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
  </Svg>
);

/** Stock / mercadería. */
export const BoxIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
    <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
  </Svg>
);

/** Proveedores. */
export const TruckIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
    <circle cx="7" cy="17.5" r="1.8" />
    <circle cx="17.5" cy="17.5" r="1.8" />
  </Svg>
);

export const ShieldIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 3 5 6v6c0 4.4 3 7.5 7 9 4-1.5 7-4.6 7-9V6z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

/** Lista de precios. */
export const TagIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 4h7l9 9-7 7-9-9z" />
    <path d="M8 8h.01" />
  </Svg>
);

/** Ajuste de stock (conteo). */
export const SlidersIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Svg>
);

export const CalendarIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M16 3v4M8 3v4M4 11h16" />
  </Svg>
);

/** Avisos. */
export const BellIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Svg>
);

/** Empleados. */
export const IdIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <circle cx="9" cy="10" r="2" />
    <path d="M6 16a3 3 0 0 1 6 0M15 9h3M15 13h3" />
  </Svg>
);

/** Gastos. */
export const WalletIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 7a2 2 0 0 1 2-2h11v4" />
    <path d="M4 7v10a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H6a2 2 0 0 1-2-2z" />
    <path d="M16 14h.01" />
  </Svg>
);

export const PrinterIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M7 9V4h10v5" />
    <path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
    <path d="M7 14h10v6H7z" />
  </Svg>
);
