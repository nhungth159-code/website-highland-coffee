"use client";

import { LanguageProvider } from "@/contexts/LanguageContext";

export default function LanguageWrapper({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
