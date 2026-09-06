"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Refetch session when window regains focus to keep auth state fresh
      refetchOnWindowFocus={true}
      // Refetch every 5 minutes to catch expired sessions
      refetchInterval={5 * 60}
    >
      {children}
    </SessionProvider>
  );
}
