"use client";

import { useLang } from "@/contexts/LanguageContext";
import { LANGUAGE_OPTIONS } from "@/lib/i18n";

interface Props { theme?: "on-dark" | "on-light"; }

export default function LanguageSwitcher({ theme = "on-dark" }: Props) {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center gap-0.5">
      {LANGUAGE_OPTIONS.map((opt) => (
        <button
          key={opt.code}
          onClick={() => setLang(opt.code)}
          className={`px-2.5 py-1 text-[11px] font-bold tracking-wider transition-all duration-150 ${
            lang === opt.code
              ? "bg-[#C8820A] text-white"
              : theme === "on-dark"
                ? "text-white/40 hover:text-white/70"
                : "text-[#3B1F0A]/40 hover:text-[#3B1F0A]/70"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
