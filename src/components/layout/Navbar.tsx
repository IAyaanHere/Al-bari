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
  ChevronDown,
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
  const { t } = useTranslation();
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

  // Prevent background scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

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
        { href: "/daily-monitoring", label: "Daily Monitoring", icon: Camera, highlight: true },
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

  return (
    <>
      {/* 
        IMPORTANT: No backdrop-blur on root header element.
        Backdrop-blur creates a CSS containing block which breaks fixed position
        of descendant mobile menus on mobile browsers.
      */}
      <header className="sticky top-0 z-40 w-full border-b border-emerald-900/10 bg-white shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
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

            {/* Desktop Navigation Links (Visible on desktop >= 1024px) */}
            <nav className="hidden lg:flex items-center gap-1">
              {publicLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all ${
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

              {/* Faculty Links (if logged in) */}
              {isTeacher && (
                <>
                  <div className="h-4 w-px bg-slate-200 mx-1" />
                  <Link
                    href="/daily-monitoring"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs xl:text-sm font-bold transition-all shadow-2xs ${
                      pathname === "/daily-monitoring"
                        ? "bg-amber-400 text-slate-950 border border-amber-500"
                        : "bg-emerald-800 text-white hover:bg-emerald-700"
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-300" />
                    <span>Daily Monitoring</span>
                  </Link>

                  <Link
                    href="/upload"
                    className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all ${
                      pathname === "/upload"
                        ? "bg-emerald-50 text-emerald-900 font-semibold"
                        : "text-slate-600 hover:text-emerald-950 hover:bg-slate-50"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{t.nav.upload}</span>
                  </Link>

                  <Link
                    href="/my-uploads"
                    className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all ${
                      pathname === "/my-uploads"
                        ? "bg-emerald-50 text-emerald-900 font-semibold"
                        : "text-slate-600 hover:text-emerald-950 hover:bg-slate-50"
                    }`}
                  >
                    <FolderArchive className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{t.nav.myUploads}</span>
                  </Link>
                </>
              )}

              {/* Admin Links (if admin) */}
              {isAdmin && (
                <>
                  <div className="h-4 w-px bg-slate-200 mx-1" />
                  <Link
                    href="/admin/users"
                    className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all ${
                      pathname.startsWith("/admin/users")
                        ? "bg-emerald-100/70 text-emerald-950 font-semibold"
                        : "text-slate-600 hover:text-emerald-950 hover:bg-slate-50"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Teachers</span>
                  </Link>

                  <Link
                    href="/admin/madrasas"
                    className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all ${
                      pathname.startsWith("/admin/madrasas")
                        ? "bg-emerald-100/70 text-emerald-950 font-semibold"
                        : "text-slate-600 hover:text-emerald-950 hover:bg-slate-50"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Madrasas</span>
                  </Link>

                  <Link
                    href="/admin/moderation"
                    className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all ${
                      pathname.startsWith("/admin/moderation")
                        ? "bg-emerald-100/70 text-emerald-950 font-semibold"
                        : "text-slate-600 hover:text-emerald-950 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Moderate</span>
                  </Link>
                </>
              )}
            </nav>

            {/* Desktop Right Controls: Language Selector + Auth */}
            <div className="hidden lg:flex items-center gap-2.5">
              <LanguageSelector />

              {user ? (
                <div className="flex items-center gap-2 border-s border-slate-200 ps-2.5">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
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
                    title="Logout"
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

            {/* Mobile / Tablet Controls: Language Selector + Hamburger Menu Button */}
            <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0">
              <LanguageSelector />
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="p-2 sm:p-2.5 rounded-xl text-slate-800 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-colors flex items-center justify-center border border-slate-300 shadow-2xs shrink-0 touch-manipulation"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 
        MOBILE NAVIGATION DRAWER OVERLAY
        Rendered outside the header so it covers 100% of the screen without clipping.
      */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex flex-col justify-start">
          {/* Backdrop Overlay (click to close) */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Menu Panel */}
          <div className="relative w-full max-h-[90vh] bg-white border-b-2 border-emerald-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-top-4 duration-200">
            {/* Top Close bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-emerald-950 text-white border-b border-emerald-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-bold tracking-wider uppercase text-emerald-200">
                  Navigation Menu
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable menu content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* User Identity / Auth Card */}
              {user ? (
                <div className="p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Logged in as
                    </p>
                    <p className="text-sm font-extrabold text-emerald-950 truncate">
                      {user.full_name || "Faculty"}
                    </p>
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
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Public Guest Mode</span>
                    <span className="text-[11px] text-slate-500">Sign in for teacher & admin tools</span>
                  </div>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="gap-1.5 text-xs font-bold">
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{t.nav.login}</span>
                    </Button>
                  </Link>
                </div>
              )}

              {/* TEACHER / FACULTY SHORTCUT (Highlighted) */}
              {isTeacher && (
                <div className="space-y-1.5 pt-1">
                  <div className="px-1 text-[11px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-600" />
                    <span>Daily Progress & Uploads</span>
                  </div>
                  
                  <Link
                    href="/daily-monitoring"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-950 text-white shadow-md border border-amber-400/40 group active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-tight text-white flex items-center gap-1.5">
                          <span>Daily Academic Monitoring</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black uppercase">Fast</span>
                        </p>
                        <p className="text-[11px] text-emerald-200">Upload notebook & blackboard</p>
                      </div>
                    </div>
                  </Link>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href="/upload"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        pathname === "/upload"
                          ? "bg-emerald-100/70 text-emerald-950 border-emerald-300"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Upload className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{t.nav.upload}</span>
                    </Link>

                    <Link
                      href="/my-uploads"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        pathname === "/my-uploads"
                          ? "bg-emerald-100/70 text-emerald-950 border-emerald-300"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <FolderArchive className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{t.nav.myUploads}</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* ADMIN PANEL SHORTCUTS */}
              {isAdmin && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="px-1 text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Administration Center</span>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href="/admin/users"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        pathname.startsWith("/admin/users")
                          ? "bg-emerald-800 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Users className="w-4 h-4 text-emerald-700" />
                      <span>Manage Teachers & Accounts</span>
                    </Link>

                    <Link
                      href="/admin/madrasas"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        pathname.startsWith("/admin/madrasas")
                          ? "bg-emerald-800 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-emerald-700" />
                      <span>Manage Madrasas</span>
                    </Link>

                    <Link
                      href="/admin/moderation"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        pathname.startsWith("/admin/moderation")
                          ? "bg-emerald-800 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-700" />
                      <span>Moderate Posts & Records</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* PUBLIC DISCOVERY LINKS */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="px-1 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Public Pages
                </div>

                {publicLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-emerald-50 text-emerald-950 border border-emerald-200"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-700" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Bottom Login Button for Guest */}
              {!user && (
                <div className="pt-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                    <Button variant="primary" className="w-full py-3 gap-2 text-sm font-bold shadow-md">
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Teacher / Admin Portal</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
