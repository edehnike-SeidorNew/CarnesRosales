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
