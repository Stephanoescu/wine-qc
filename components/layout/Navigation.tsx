"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  AlertTriangle,
  Wine,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/operario", label: "Vista Operario", icon: ListChecks },
  { href: "/alertas", label: "Alertas", icon: AlertTriangle, badge: 1 },
];

// ─────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-zinc-950 border-r border-zinc-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-600/30">
          <Wine className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-100 leading-none">VinControl</p>
          <p className="text-xs text-zinc-600 mt-0.5">Control de calidad</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                isActive
                  ? "bg-emerald-600/15 text-emerald-400 border border-emerald-600/20"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-semibold">
                  {item.badge}
                </span>
              ) : (
                <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? "opacity-100" : ""}`} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
            OP
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-300">Operario #04</p>
            <p className="text-xs text-zinc-600">Turno mañana</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────
// TopBar — mobile navigation
// ─────────────────────────────────────────
export function TopBar({ title }: { title: string }) {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950 lg:hidden">
      <div className="flex items-center gap-2">
        <Wine className="w-5 h-5 text-emerald-400" />
        <span className="text-sm font-bold text-zinc-100">VinControl</span>
      </div>
      <span className="text-sm text-zinc-400">{title}</span>
      <div className="flex gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`p-2 rounded-lg transition-colors relative ${
                isActive ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.badge && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
