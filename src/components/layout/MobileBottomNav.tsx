"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  IndianRupee,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const bottomNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/workers", label: "Workers", icon: Users },
  { href: "/salary", label: "Salary", icon: IndianRupee },
  { href: "#more", label: "More", icon: MoreHorizontal },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  // Check if current path matches any of the "more" pages
  const morePages = ["/calendar", "/leave", "/holidays", "/reports", "/settings"];
  const isMoreActive = morePages.some(
    (p) => pathname === p || pathname?.startsWith(p + "/")
  );

  return (
    <nav className="mobile-bottom-nav lg:hidden" id="mobile-bottom-nav">
      {bottomNavItems.map((item) => {
        const isMore = item.href === "#more";
        const isActive = isMore
          ? isMoreActive
          : pathname === item.href || pathname?.startsWith(item.href + "/");

        // "More" button opens the sidebar
        if (isMore) {
          return (
            <button
              key={item.href}
              onClick={() => {
                const btn = document.getElementById("mobile-menu-btn");
                if (btn) btn.click();
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-all",
                isActive ? "text-slate-900" : "text-slate-400"
              )}
            >
              <item.icon className="w-[22px] h-[22px]" />
              <span>{item.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-all",
              isActive ? "text-slate-900" : "text-slate-400"
            )}
          >
            <item.icon className="w-[22px] h-[22px]" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
