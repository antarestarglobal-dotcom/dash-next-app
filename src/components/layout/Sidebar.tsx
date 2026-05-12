"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Upload,
  Clock,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/run-rate", label: "Run Rate", icon: BarChart3 },
  { href: "/imports", label: "Import Data", icon: Upload },
  { href: "/imports/history", label: "Riwayat Import", icon: Clock },
] as const;

// /imports must be exact — /imports/history is its own nav item
const EXACT_MATCH = new Set(["/imports"]);

function useActiveRoute() {
  const pathname = usePathname();
  return (href: string) => {
    if (EXACT_MATCH.has(href)) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };
}

// ─── Shared nav items ────────────────────────────────────────────────────────

function NavItems({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const isActive = useActiveRoute();

  return (
    <nav className="flex-1 py-4 flex flex-col gap-0.5 px-2 overflow-y-auto">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={[
              "group flex items-center gap-3 px-3 py-2.5 text-sm font-semibold",
              "border-2 transition-colors duration-100",
              collapsed ? "justify-center" : "",
              active
                ? "bg-neutral-950 text-white border-neutral-950 shadow-[2px_2px_0px_#525252]"
                : [
                    "border-transparent text-neutral-500",
                    "hover:bg-stone-100 hover:text-neutral-950 hover:border-neutral-200",
                  ].join(" "),
            ].join(" ")}
          >
            <Icon
              className={[
                "flex-shrink-0 transition-transform duration-100",
                collapsed ? "w-5 h-5" : "w-4 h-4",
                !active && "group-hover:scale-110",
              ].join(" ")}
            />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Logo block ───────────────────────────────────────────────────────────────

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={["flex items-center gap-3", collapsed ? "justify-center" : ""].join(" ")}>
      <div className="w-7 h-7 bg-neutral-950 flex items-center justify-center flex-shrink-0">
        <span className="text-white font-black text-xs select-none">A</span>
      </div>
      {!collapsed && (
        <div className="leading-tight overflow-hidden">
          <p className="font-black text-[11px] uppercase tracking-widest text-neutral-950 truncate">
            Antarestar
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 truncate">
            CEO Command Center
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Footer / build tag ───────────────────────────────────────────────────────

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <div className="px-4 py-3 border-t border-neutral-100">
      <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-300">
        Internal Tool · v0.1
      </p>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on wide viewport resize
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) setDrawerOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      {/* ── Mobile: top bar ──────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-white border-b-2 border-neutral-950 h-14 flex items-center px-4 gap-3">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Buka menu"
          className="p-1.5 border-2 border-neutral-950 shadow-[2px_2px_0px_#171717] hover:bg-stone-100 transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
        <span className="font-black text-[11px] uppercase tracking-widest text-neutral-950">
          Antarestar CC
        </span>
      </div>

      {/* ── Mobile: backdrop ─────────────────────────────────────────────── */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={[
          "lg:hidden fixed inset-0 z-40 bg-neutral-950/50 transition-opacity duration-200",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        aria-hidden="true"
      />

      {/* ── Mobile: drawer ───────────────────────────────────────────────── */}
      <aside
        aria-label="Navigasi sidebar"
        className={[
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white",
          "border-r-2 border-neutral-950 flex flex-col",
          "transition-transform duration-200 ease-in-out",
          "shadow-[4px_0px_0px_#171717]",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-4 py-[14px] border-b-2 border-neutral-950 flex-shrink-0">
          <Logo collapsed={false} />
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Tutup menu"
            className="p-1 text-neutral-400 hover:text-neutral-950 transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <NavItems collapsed={false} onNavigate={() => setDrawerOpen(false)} />
        <SidebarFooter collapsed={false} />
      </aside>

      {/* ── Desktop: sidebar ─────────────────────────────────────────────── */}
      <aside
        aria-label="Navigasi sidebar"
        className={[
          "hidden lg:flex flex-col flex-shrink-0",
          "bg-white border-r-2 border-neutral-950",
          "sticky top-0 h-screen overflow-hidden",
          "transition-[width] duration-200 ease-in-out",
          collapsed ? "w-[60px]" : "w-60",
        ].join(" ")}
      >
        <div
          className={[
            "flex items-center px-4 py-[14px] border-b-2 border-neutral-950 flex-shrink-0",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          <Logo collapsed={collapsed} />
        </div>
        <NavItems collapsed={collapsed} />
        <SidebarFooter collapsed={collapsed} />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Perluas sidebar" : "Perkecil sidebar"}
          className={[
            "flex items-center gap-2 border-t-2 border-neutral-950 px-4 py-3 w-full",
            "text-xs font-bold uppercase tracking-wide text-neutral-400",
            "hover:bg-stone-100 hover:text-neutral-950 transition-colors",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
              <span>Perkecil</span>
            </>
          )}
        </button>
      </aside>
    </>
  );
}
