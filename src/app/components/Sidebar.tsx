"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Shield,
  Layers,
  Package,
  PackagePlus,
  Users,
  UserPlus,
  Settings,
  LogOut,
  X,
  Menu,
  ExternalLink,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePlatformAuth } from "@/contexts/PlatformAuthContext";

/* ─── Nav configuration ─── */
type MenuItem = {
  title: string;
  path: string;
  icon: React.ElementType;
};

type NavSection = {
  label: string;
  items: MenuItem[];
};

const NAV_CONFIG: NavSection[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", path: "/platform", icon: LayoutDashboard },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Tenants", path: "/platform/tenants", icon: Users },
      { title: "Add Tenant", path: "/platform/tenants/add", icon: UserPlus },
      { title: "Admin Accounts", path: "/platform/admin-accounts", icon: Shield },
    ],
  },
  {
    label: "Catalogs",
    items: [
      { title: "Feature Catalog", path: "/platform/feature-catalog", icon: Layers },
      { title: "Plan Catalog", path: "/platform/plan-catalog", icon: Package },
      { title: "Add Plan", path: "/platform/plan-catalog/add", icon: PackagePlus },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { title: "Health Checker", path: "/platform/health-checker", icon: Activity },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Settings", path: "/platform/settings", icon: Settings },
    ],
  },
];

/* ─── Section color maps (same pattern as Pos) ─── */
const SECTION_ACCENT: Record<string, string> = {
  Main: "border-l-[6px] border-l-emerald-600",
  Management: "border-l-[6px] border-l-orange-600",
  Catalogs: "border-l-[6px] border-l-indigo-600",
  Monitoring: "border-l-[6px] border-l-cyan-600",
  Settings: "border-l-[6px] border-l-slate-600",
};

const SECTION_HEADER_CHIP: Record<string, string> = {
  Main: "bg-emerald-100/80 text-emerald-900 ring-1 ring-emerald-200/70",
  Management: "bg-orange-100/80 text-orange-900 ring-1 ring-orange-200/60",
  Catalogs: "bg-indigo-100/80 text-indigo-900 ring-1 ring-indigo-200/60",
  Monitoring: "bg-cyan-100/80 text-cyan-900 ring-1 ring-cyan-200/60",
  Settings: "bg-slate-200/80 text-slate-800 ring-1 ring-slate-300/70",
};

const SECTION_ITEM_ICON: Record<string, string> = {
  Main: "text-emerald-600/85 group-hover:text-emerald-700",
  Management: "text-orange-600/85 group-hover:text-orange-700",
  Catalogs: "text-indigo-600/85 group-hover:text-indigo-700",
  Monitoring: "text-cyan-600/85 group-hover:text-cyan-700",
  Settings: "text-slate-600/90 group-hover:text-slate-800",
};

/* ─── Persistence ─── */
const STORAGE_KEY = "platform-sidebar-sections-expanded";
const MAIN_SECTION = "Main";

function getStoredSections(): string[] {
  if (typeof window === "undefined") return [MAIN_SECTION];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [MAIN_SECTION];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [MAIN_SECTION];
  } catch {
    return [MAIN_SECTION];
  }
}

function saveSections(labels: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(labels)); } catch { /* ignore */ }
}

const sidebarShellClass = "h-full flex flex-col bg-gradient-to-b from-slate-50 via-white to-orange-50/25";

/* ─── Component ─── */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set(getStoredSections()));
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { platformUser, logout } = usePlatformAuth();

  const filteredSections = useMemo(() => NAV_CONFIG.filter((s) => s.items.length > 0), []);

  /* ─── Active detection (exact match for highlighting) ─── */
  const isMenuActive = (item: MenuItem): boolean => {
    return pathname === item.path;
  };

  /* ─── Section match (prefix match for auto-expanding the right section) ─── */
  const isSectionRelated = (item: MenuItem): boolean => {
    if (item.path === "/platform") return pathname === "/platform";
    return pathname === item.path || pathname.startsWith(item.path + "/");
  };

  /* ─── Auto-expand section that has active route ─── */
  useEffect(() => {
    let activeLabel: string | null = null;
    for (const section of filteredSections) {
      if (section.items.some((item) => isMenuActive(item) || isSectionRelated(item))) {
        activeLabel = section.label;
        break;
      }
    }
    setExpandedSections((prev) => {
      const next = new Set<string>();
      next.add(MAIN_SECTION);
      if (activeLabel && activeLabel !== MAIN_SECTION) next.add(activeLabel);
      const same = next.size === prev.size && [...next].every((l) => prev.has(l));
      if (same) return prev;
      saveSections(Array.from(next));
      return next;
    });
  }, [pathname, filteredSections]);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const isSectionExpanded = (label: string) => {
    if (label === MAIN_SECTION) return true;
    return expandedSections.has(label);
  };

  const toggleSection = (label: string) => {
    if (label === MAIN_SECTION) return;
    setExpandedSections((prev) => {
      const next = new Set<string>();
      next.add(MAIN_SECTION);
      if (!prev.has(label)) next.add(label);
      saveSections(Array.from(next));
      return next;
    });
  };

  /* ─── Render single menu item ─── */
  const renderMenuItem = (item: MenuItem, index: number, sectionLabel: string) => {
    const isActive = isMenuActive(item);
    const iconIdle = SECTION_ITEM_ICON[sectionLabel] ?? "text-slate-500 group-hover:text-slate-700";

    return (
      <div key={`${item.path}-${index}`} className="relative">
        <Link
          href={item.path}
          onClick={() => isMobile && setMobileOpen(false)}
          className={cn(
            "flex items-center py-2 px-4 text-gray-700 hover:bg-orange-50/90 rounded-md cursor-pointer group transition-colors",
            isActive && "bg-orange-50 text-orange-500 shadow-sm ring-1 ring-orange-200/50",
            collapsed && !isMobile && "justify-center px-2"
          )}
        >
          <item.icon
            className={cn(
              "h-5 w-5 mr-3 flex-shrink-0 transition-colors",
              isActive ? "text-orange-500" : iconIdle,
              collapsed && !isMobile && "mr-0"
            )}
          />
          {(!collapsed || isMobile) && <span className="flex-grow">{item.title}</span>}
        </Link>
        {collapsed && !isMobile && (
          <div className="absolute left-full top-0 ml-2 px-2 py-1 bg-white rounded-md shadow-lg z-10 border hidden group-hover:block whitespace-nowrap">
            {item.title}
          </div>
        )}
      </div>
    );
  };

  /* ─── Section renderer (shared by desktop + mobile) ─── */
  const renderSections = (idPrefix: string) =>
    filteredSections.map((section) => {
      const sectionExpanded = isSectionExpanded(section.label);
      const isMain = section.label === MAIN_SECTION;
      const showHeader = !collapsed || isMobile;
      return (
        <div
          key={section.label}
          className={cn("relative pl-2", SECTION_ACCENT[section.label] ?? "border-l-[6px] border-l-transparent")}
        >
          {showHeader ? (
            <>
              {isMain ? (
                <div
                  className={cn(
                    "flex w-full cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold shadow-sm",
                    SECTION_HEADER_CHIP[section.label] ?? "bg-slate-100/90 text-slate-800 ring-1 ring-slate-200/80"
                  )}
                  id={`${idPrefix}-btn-${section.label}`}
                >
                  <ChevronRight className="h-4 w-4 shrink-0 rotate-90" aria-hidden />
                  <span className="truncate">{section.label}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSection(section.label); } }}
                  aria-expanded={sectionExpanded}
                  aria-controls={`${idPrefix}-${section.label}`}
                  id={`${idPrefix}-btn-${section.label}`}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-800 transition-colors",
                    "hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1",
                    sectionExpanded && (SECTION_HEADER_CHIP[section.label] ?? "bg-slate-100/90 text-slate-800 ring-1 ring-slate-200/80")
                  )}
                >
                  <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform duration-200", sectionExpanded && "rotate-90")} aria-hidden />
                  <span className="truncate">{section.label}</span>
                </button>
              )}
              <div
                id={`${idPrefix}-${section.label}`}
                role="region"
                aria-labelledby={`${idPrefix}-btn-${section.label}`}
                hidden={!sectionExpanded}
              >
                {section.items.map((item, idx) => renderMenuItem(item, idx, section.label))}
              </div>
            </>
          ) : (
            section.items.map((item, idx) => renderMenuItem(item, idx, section.label))
          )}
        </div>
      );
    });

  /* ─── Bottom bar: user + logout + open tenant app ─── */
  const renderBottomBar = () => (
    <div className={cn("border-t border-gray-200 shrink-0", collapsed && !isMobile ? "px-2 py-3" : "px-4 py-3")}>
      {(!collapsed || isMobile) && platformUser && (
        <p className="text-xs text-gray-500 truncate mb-2">{platformUser.email}</p>
      )}
      <div className={cn("flex gap-2", collapsed && !isMobile ? "flex-col items-center" : "items-center")}>
        <a
          href={process.env.NEXT_PUBLIC_TENANT_APP_URL || "http://localhost:3001"}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 transition-colors",
            collapsed && !isMobile && "justify-center"
          )}
          title="Open Tenant App"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {(!collapsed || isMobile) && <span>Tenant App</span>}
        </a>
        <button
          onClick={logout}
          className={cn(
            "flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors ml-auto",
            collapsed && !isMobile && "ml-0"
          )}
          title="Logout"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(!collapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  /* ─── Mobile sidebar ─── */
  if (isMobile) {
    return (
      <>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="fixed top-4 left-4 z-50 p-2 text-gray-700" aria-label="Toggle menu">
          <Menu className="h-6 w-6" />
        </button>

        <div className={cn("fixed inset-0 z-40 transform transition-transform duration-200 ease-out", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="absolute inset-0 bg-black/25" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className={cn("relative w-64 shadow-lg flex flex-col", sidebarShellClass)}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-300">
              <div className="flex items-center min-w-0 shrink">
                <img src="/images/inflix-logo.png" alt="Inflix" className="h-10 w-auto max-w-[200px] object-contain object-left"
                  onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement?.querySelector(".logo-fallback")?.classList.remove("hidden"); }} />
                <span className="logo-fallback hidden text-base font-semibold text-gray-800 truncate">Inflix Platform</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-gray-500 shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Platform badge */}
            <div className="px-4 py-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 ring-1 ring-purple-200/60">
                <Shield className="h-3 w-3" /> Platform Console
              </span>
            </div>

            {/* Sections */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-0">
              {renderSections("sidebar-mobile")}
            </div>

            {renderBottomBar()}
          </div>
        </div>
      </>
    );
  }

  /* ─── Desktop sidebar ─── */
  return (
    <div
      className={cn(
        "h-screen flex flex-col border-r border-gray-200/80 transition-all duration-200 ease-out pt-4 md:flex shadow-sm",
        sidebarShellClass,
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn("flex border-b border-gray-300 shrink-0 min-h-[56px] items-center gap-2", collapsed ? "flex-col px-2 pb-3" : "flex-row justify-between pl-4 pr-3 pb-3")}>
        <div className={cn("flex items-center justify-center shrink-0 overflow-hidden bg-transparent", collapsed ? "w-11 h-11" : "w-[140px] h-10")}>
          <img
            src="/images/inflix-logo.png"
            alt="Inflix"
            className={cn("w-full h-full object-contain", collapsed ? "object-center" : "object-left object-top")}
            style={{ minWidth: 0, minHeight: 0 }}
            onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement?.querySelector(".logo-fallback")?.classList.remove("hidden"); }}
          />
          <span className="logo-fallback hidden text-base font-semibold text-gray-800 truncate">Inflix</span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-full bg-orange-500 text-white shrink-0 p-1.5 flex items-center justify-center"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Platform badge */}
      {!collapsed && (
        <div className="px-4 py-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 ring-1 ring-purple-200/60">
            <Shield className="h-3 w-3" /> Platform Console
          </span>
        </div>
      )}

      {/* Sections */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-0">
        {renderSections("sidebar")}
      </div>

      {renderBottomBar()}
    </div>
  );
}
