"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { Language } from "@/lib/i18n/translations";

export function LanguageSelector() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="language-select" className="sr-only">
        Select Language
      </label>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white/90 text-xs sm:text-sm font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors">
        <Globe className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-transparent border-none text-slate-700 focus:outline-none cursor-pointer pr-1"
        >
          <option value="en">English (EN)</option>
          <option value="hi">हिन्दी (HI)</option>
          <option value="ur">اردو (UR)</option>
        </select>
      </div>
    </div>
  );
}
