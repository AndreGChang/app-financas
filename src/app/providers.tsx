"use client";

import type React from 'react';
// import { ThemeProvider } from "next-themes"; // Example if theme switching is added

export function Providers({ children }: { children: React.ReactNode }) {
  // Example: <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  return <>{children}</>;
  // </ThemeProvider>
}
