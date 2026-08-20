"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LayoutDashboard, Film, List, Ticket, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Add Shows", href: "/admin/add-shows", icon: Film, exact: true },
  { name: "List Shows", href: "/admin/shows", icon: List, exact: false },
  { name: "List Bookings", href: "/admin/bookings", icon: Ticket, exact: true },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <Link href="/" className="block mb-8 text-lg font-bold text-red-600">
        COUCH POTATO
      </Link>
      <nav className="space-y-1 flex-1">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-red-600/15 text-white border-l-2 border-red-600 -ml-0.5 pl-[11px]"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors border-t border-white/10 pt-4 mt-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to site
      </Link>
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileOpen]);

  return (
    <div className="min-h-screen flex bg-[#0b0b0b] text-white">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-white/10 bg-[#111111] p-4 flex-col">
        <SidebarNav />
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[#111111] border-r border-white/10 p-4 transition-transform duration-300 md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarNav onNavigate={() => setIsMobileOpen(false)} />
      </aside>

      <div className="flex-1 min-w-0">
        <header className="border-b border-white/10 px-4 md:px-6 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className="md:hidden text-gray-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle admin menu"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-lg font-semibold">Admin</h1>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
