"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Building2,
  LayoutDashboard,
  Upload,
  FolderArchive,
  ShieldCheck,
  Users,
  LogOut,
  LogIn,
  Home,
  CheckCircle,
  Camera,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { LanguageSelector } from "./LanguageSelector";
import { Button } from "../ui/button";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  initialUser?: {
    id: string;
    role: string;
    full_name: string;
  } | null;
}

export function Navbar({ initialUser }: NavbarProps) {
  const { t, dir } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState(initialUser || null);

  React.useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data } = await supabase
            .from("profiles")
            .select("id, role, full_name")
            .eq("id", authUser.id)
            .single();
          if (data) {
            setUser(data);
            return;
          }
        }

        // Secondary check via server endpoint
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const resData = await res.json();
          if (resData?.user) {
            setUser(resData.user);
            return;
          }
        }

        setUser(null);
      } catch (err) {
        console.error("Navbar profile load error:", err);
      }
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser();
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      // 1. Clear server-side session cookies
      await fetch("/api/auth/logout", { method: "POST" });
      
      // 2. Clear client-side supabase session
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Signout error:", err);
    } finally {
      setUser(null);
      setMobileMenuOpen(false);
      window.location.href = "/login";
    }
  };

  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher" || isAdmin;

  const publicLinks = [
    { href: "/", label: t.nav.overview, icon: Home },
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/madrasas", label: t.nav.madrasas, icon: Building2 },
  ];

  const teacherLinks = isTeacher
    ? [
        { href: "/daily-monitoring", label: "Daily Monitoring", icon: Camera },
        { href: "/upload", label: t.nav.upload, icon: Upload },
        { href: "/my-uploads", label: t.nav.myUploads, icon: FolderArchive },
      ]
    : [];

  const adminLinks = isAdmin
    ? [
        { href: "/admin/moderation", label: t.nav.moderation, icon: CheckCircle },
        { href: "/admin/madrasas", label: t.nav.adminMadrasas, icon: Building2 },
        { href: "/admin/users", label: t.nav.adminUsers, icon: Users },
      ]
    : [];

  const allNavLinks = [...publicLinks, ...teacherLinks, ...adminLinks];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/10 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-18 items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink min-w-0 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-amber-400 shadow-md group-hover:scale-105 transition-transform border border-amber-500/30 shrink-0">
              <span className="font-bold text-base sm:text-xl">ب</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm sm:text-base lg:text-lg tracking-tight text-emerald-950 leading-tight truncate">
                {t.appName}
              </span>
              <span className="hidden sm:inline text-[10px] sm:text-xs text-amber-700 font-medium tracking-wide">
                Islamic Education Foundation
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {allNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200/80 shadow-2xs"
                      : "text-slate-600 hover:text-emerald-950 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4 text-emerald-700" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Controls: Language Selector + Auth */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageSelector />

            {user ? (
              <div className="flex items-center gap-2.5 border-s border-slate-200 ps-3">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                    {user.full_name || "User"}
                  </span>
                  <span className="text-[10px] uppercase font-extrabold text-emerald-800">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-all shadow-2xs hover:shadow-xs"
                  title="Logout / لاگ آؤٹ"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  <span>{t.nav.login}</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Right Controls: Language Selector + Hamburger Menu Button (Always visible & shrink-0) */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0">
            <LanguageSelector />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 sm:p-2.5 rounded-xl text-slate-800 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 transition-colors touch-target flex items-center justify-center border border-slate-300 shadow-2xs shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 sm:top-18 bottom-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-start animate-in fade-in duration-150">
          <div className="w-full bg-white border-b border-slate-200 p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* User status card if logged in */}
            {user ? (
              <div className="mb-4 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-emerald-950 truncate">{user.full_name}</p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-800 text-white rounded">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Public Guest Access</span>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="gap-1.5 text-xs">
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{t.nav.login}</span>
                  </Button>
                </Link>
              </div>
            )}

            {/* Navigation links */}
            <nav className="flex flex-col space-y-1">
              {allNavLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      isActive
                        ? "bg-emerald-800 text-white shadow-xs font-semibold"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-amber-300" : "text-emerald-700"}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Login button if guest */}
            {!user && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link href="/login" className="block w-full">
                  <Button variant="primary" className="w-full py-3 gap-2 text-base">
                    <LogIn className="w-5 h-5" />
                    <span>{t.nav.login}</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
