"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <main className="lg:pl-[260px] min-h-screen transition-all duration-300">
        <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-6 pb-24 lg:pb-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
