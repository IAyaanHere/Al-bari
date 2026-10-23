"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { ShieldCheck, HeartHandshake, BookOpen } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="w-full bg-emerald-950 text-white mt-auto border-t-4 border-amber-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-900 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                ب
              </div>
              <span className="font-bold text-lg text-white tracking-wide">
                {t.appName}
              </span>
            </div>
            <p className="text-emerald-200/80 text-xs sm:text-sm max-w-md leading-relaxed">
              {t.tagline}. Centralizing curriculum preservation, examination archives, attendance registries, and madrasa operational records with zero recurring software licensing costs.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-300/90 pt-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Strict Google Drive Storage & Row-Level Authorization</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-amber-400">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-emerald-100/80">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  {t.nav.overview}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  {t.nav.dashboard}
                </Link>
              </li>
              <li>
                <Link href="/madrasas" className="hover:text-white transition-colors">
                  {t.nav.madrasas}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  {t.nav.login}
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture & Free-Tier Assurance */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-amber-400">
              System Specifications
            </h4>
            <div className="text-xs text-emerald-100/70 space-y-2 leading-relaxed">
              <p>• Next.js App Router & TypeScript</p>
              <p>• Supabase PostgreSQL & RLS Security</p>
              <p>• Direct Google Drive Resumable Upload Engine</p>
              <p>• Client-Side Image Compression</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-300/70">
          <p>© {new Date().getFullYear()} Al Bari Organization. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>English • हिन्दी • اردو</span>
            <span>Privacy & Security Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
