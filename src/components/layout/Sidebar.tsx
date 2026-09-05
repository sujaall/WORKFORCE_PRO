"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Calendar,
  IndianRupee,
  Sun,
  PartyPopper,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Factory,
  Menu,
  X,
  Receipt,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workers", label: "Workers", icon: Users },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/salary", label: "Salary", icon: IndianRupee },
  { href: "/leave", label: "Leave", icon: Sun },
  { href: "/holidays", label: "Holidays", icon: PartyPopper },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-100"
        id="mobile-menu-btn"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-white border-r border-gray-100 z-40 flex flex-col transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo area */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-gray-50",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <Factory className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-gray-900 truncate">WorkForce Pro</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Management</p>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-100 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "sidebar-item",
                  isActive ? "sidebar-item-active" : "sidebar-item-inactive",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "text-gray-500")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden lg:block px-3 py-2 border-t border-gray-50">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-item sidebar-item-inactive w-full justify-center"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* User & Logout */}
        <div className={cn(
          "px-3 py-3 border-t border-gray-50",
          collapsed ? "flex justify-center" : ""
        )}>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "sidebar-item sidebar-item-inactive w-full text-red-600 hover:bg-red-50 hover:text-red-700",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Footer credit */}
        {!collapsed && (
          <div className="pb-3 px-3">
            <p className="text-xs text-muted-foreground text-center opacity-60 select-none">
              Built by Sujal
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
