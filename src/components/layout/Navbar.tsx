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
        // Also check if server session still exists before wiping
        fetch("/api/auth/me")
          .then((res) => res.json())
          .then((d) => {
            if (d?.user) setUser(d.user);
            else setUser(null);
          })
          .catch(() => setUser(null));
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
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
    router.refresh();
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
        <div className="flex h-16 sm:h-18 items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-amber-400 shadow-md group-hover:scale-105 transition-transform border border-amber-500/30">
              <span className="font-bold text-lg sm:text-xl">ب</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight text-emerald-950 leading-tight">
                {t.appName}
              </span>
              <span className="text-[10px] sm:text-xs text-amber-700 font-medium tracking-wide">
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
              <div className="flex items-center gap-2 border-s border-slate-200 ps-3">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                    {user.full_name || "User"}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-700">
                    {user.role}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-slate-600 hover:text-rose-600"
                  title={t.nav.logout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
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

          {/* Mobile Right Controls: Language Selector + Hamburger Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSelector />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors touch-target flex items-center justify-center border border-slate-200"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 sm:top-18 bottom-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-start animate-in fade-in duration-150">
          <div className="w-full bg-white border-b border-slate-200 p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* User status card if logged in */}
            {user && (
              <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-emerald-950">{user.full_name}</p>
                  <p className="text-xs text-emerald-700 font-semibold uppercase">{user.role}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-rose-600 hover:bg-rose-50 border-rose-200 gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.nav.logout}</span>
                </Button>
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
