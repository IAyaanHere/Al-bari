"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  RefreshCw,
  KeyRound,
  Shield,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Building2,
  Search,
  School,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Madrasa } from "@/types/database";
import { generateTemporaryPassword } from "@/lib/auth/passwords";

interface UserRecord {
  id: string;
  full_name: string;
  username: string | null;
  role: string;
  active: boolean;
  must_change_password?: boolean;
  created_at: string;
  teacher_madrasas?: Array<{
    madrasa: {
      id: string;
      name: string;
      city?: string;
    };
  }>;
}

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [madrasas, setMadrasas] = React.useState<Madrasa[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "deactivated">("all");

  // Register modal state
  const [registerModalOpen, setRegisterModalOpen] = React.useState<boolean>(false);
  const [fullName, setFullName] = React.useState<string>("");
  const [username, setUsername] = React.useState<string>("");
  const [tempPassword, setTempPassword] = React.useState<string>("");
  const [selectedMadrasaIds, setSelectedMadrasaIds] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Success credentials display modal
  const [createdCredentials, setCreatedCredentials] = React.useState<any>(null);
  const [copied, setCopied] = React.useState<boolean>(false);

  const fetchUsersAndMadrasas = async () => {
    setIsLoading(true);
    try {
      const [usersRes, madrasasRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/madrasas"),
      ]);

      if (usersRes.status === 403) {
        router.push("/dashboard");
        return;
      }

      const usersData = await usersRes.json();
      const madrasasData = await madrasasRes.json();

      if (usersData.profiles) setUsers(usersData.profiles);
      if (madrasasData.madrasas) setMadrasas(madrasasData.madrasas);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsersAndMadrasas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openRegisterModal = () => {
    setFullName("");
    setUsername("");
    setTempPassword(generateTemporaryPassword(12));
    setSelectedMadrasaIds(madrasas.length > 0 ? [madrasas[0].id] : []);
    setError(null);
    setRegisterModalOpen(true);
  };

  const regeneratePassword = () => {
    setTempPassword(generateTemporaryPassword(12));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter the teacher's full name.");
      return;
    }

    if (!username.trim() || username.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          temporaryPassword: tempPassword,
          assignedMadrasaIds: selectedMadrasaIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register teacher");

      setRegisterModalOpen(false);
      setCreatedCredentials(data.credentials);
      fetchUsersAndMadrasas();
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, active: !currentActive } : u))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update user status");
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (!confirm(`Generate a new temporary password for "${userName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`New Temporary Password: ${data.newTemporaryPassword}\nPlease share this securely with the teacher.`);
    } catch (err: any) {
      alert(err.message || "Password reset failed");
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = `Al Bari Hub Teacher Login Credentials\nEducator: ${createdCredentials.fullName}\nUsername: ${createdCredentials.username}\nTemporary Password: ${createdCredentials.temporaryPassword}\nLogin Portal: ${origin}/login`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "active") return u.active;
    if (statusFilter === "deactivated") return !u.active;
    return true;
  });

  const totalTeachers = users.filter((u) => u.role === "teacher").length;
  const activeTeachers = users.filter((u) => u.role === "teacher" && u.active).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 uppercase tracking-wider">
                Administration
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">
                {users.length} Total Accounts
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-emerald-800 shrink-0" />
              <span>Teacher & User Management</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Create teacher login accounts with unique usernames, assign madrasas, monitor active faculty, and issue password resets.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={openRegisterModal}
            className="w-full md:w-auto min-h-[46px] px-5 text-sm font-bold gap-2 shadow-sm rounded-xl shrink-0"
          >
            <UserPlus className="w-5 h-5 text-amber-300" />
            <span>Add New Teacher</span>
          </Button>
        </div>

        {/* Quick KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Accounts
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 block">
              {users.length}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
              Active Teachers
            </span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-950 mt-0.5 block">
              {activeTeachers}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
              Total Madrasas
            </span>
            <span className="text-xl sm:text-2xl font-bold text-amber-950 mt-0.5 block">
              {madrasas.length}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Deactivated
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-700 mt-0.5 block">
              {users.filter((u) => !u.active).length}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search teachers by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === "all"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === "active"
                ? "bg-white text-emerald-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Active ({users.filter((u) => u.active).length})
          </button>
          <button
            onClick={() => setStatusFilter("deactivated")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === "deactivated"
                ? "bg-white text-rose-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Deactivated ({users.filter((u) => !u.active).length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-24 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-800" />
          <p className="text-xs font-medium text-slate-500">Loading educator directory...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-100">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {searchQuery ? "No matching teachers found" : "No teacher accounts registered yet"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? "Try adjusting your search query or clear the filter."
                : "Register your organization's teachers so they can begin uploading student exam records and attendance."}
            </p>
          </div>
          {!searchQuery && (
            <Button variant="primary" onClick={openRegisterModal} className="gap-2 mx-auto">
              <UserPlus className="w-4 h-4" />
              <span>Register First Teacher</span>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (Screens < 768px): Card based responsive layout */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredUsers.map((user) => {
              const assignedList =
                user.teacher_madrasas?.map((tm) => tm.madrasa?.name).filter(Boolean) || [];

              return (
                <div
                  key={user.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center font-bold text-base shrink-0">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {user.full_name}
                        </h3>
                        <p className="text-xs font-mono text-slate-500 mt-0.5">
                          @{user.username || "no-username"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={user.role === "admin" ? "gold" : "default"}
                        className="capitalize text-[10px] px-2 py-0.5"
                      >
                        {user.role}
                      </Badge>
                      {user.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                          <XCircle className="w-3 h-3" /> Deactivated
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assigned Madrasas list */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Assigned Madrasa(s)
                    </span>
                    {user.role === "admin" ? (
                      <span className="text-emerald-800 font-semibold flex items-center gap-1">
                        <School className="w-3.5 h-3.5" /> All Madrasas (Admin Full Access)
                      </span>
                    ) : assignedList.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {assignedList.map((mName, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 text-slate-800 rounded-md font-medium text-[11px]"
                          >
                            <Building2 className="w-3 h-3 text-emerald-700" />
                            {mName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-amber-700 italic">No madrasa assigned yet</span>
                    )}
                  </div>

                  {/* Mobile Actions Toolbar */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    {user.role !== "admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(user.id, user.active)}
                        className={`flex-1 text-xs font-semibold h-9 ${
                          user.active
                            ? "text-rose-700 hover:bg-rose-50 border-rose-200"
                            : "text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                        }`}
                      >
                        {user.active ? "Deactivate" : "Activate"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetPassword(user.id, user.full_name)}
                      className="text-xs font-semibold h-9 gap-1 text-slate-700 hover:bg-slate-50 border-slate-200"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Reset Password</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP / PC VIEW (Screens >= 768px): Spacious Data Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-4 px-5">Educator / Name</th>
                    <th className="py-4 px-5">Username</th>
                    <th className="py-4 px-5">Role</th>
                    <th className="py-4 px-5">Assigned Madrasas</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const assignedList =
                      user.teacher_madrasas?.map((tm) => tm.madrasa?.name).filter(Boolean) || [];

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-900">{user.full_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 font-mono text-slate-600 text-xs">
                          <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200/70">
                            @{user.username || "-"}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <Badge
                            variant={user.role === "admin" ? "gold" : "default"}
                            className="capitalize text-[11px]"
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-4 px-5 text-slate-600 text-xs">
                          {user.role === "admin" ? (
                            <span className="text-emerald-800 font-semibold flex items-center gap-1">
                              <School className="w-3.5 h-3.5" /> All Madrasas (Admin Full Access)
                            </span>
                          ) : assignedList.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {assignedList.map((mName, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 rounded font-medium text-[11px]"
                                >
                                  {mName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-amber-600 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          {user.active ? (
                            <Badge variant="success" className="gap-1 text-[11px]">
                              <CheckCircle className="w-3 h-3" />
                              <span>Active</span>
                            </Badge>
                          ) : (
                            <Badge variant="danger" className="gap-1 text-[11px]">
                              <XCircle className="w-3 h-3" />
                              <span>Deactivated</span>
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right whitespace-nowrap space-x-2">
                          {user.role !== "admin" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(user.id, user.active)}
                              className={
                                user.active
                                  ? "text-rose-600 hover:bg-rose-50 border-rose-200"
                                  : "text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                              }
                            >
                              {user.active ? "Deactivate" : "Activate"}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(user.id, user.full_name)}
                            className="gap-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            title="Generate new temporary password"
                          >
                            <KeyRound className="w-4 h-4 text-amber-600" />
                            <span className="hidden lg:inline text-xs">Reset Key</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Register Teacher Modal */}
      <Dialog
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Register New Teacher Account"
        description="Create an official teacher login with unique username and first-time temporary password."
        maxWidth="md"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Teacher Full Name *"
            placeholder="e.g. Maulana Tariq Ahmad"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Unique Username *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                @
              </span>
              <input
                type="text"
                required
                placeholder="e.g. tariq_ahmad"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))
                }
                className="w-full h-11 pl-8 pr-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Lowercase letters, numbers, dots, and underscores only.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Initial Temporary Password *
              </label>
              <button
                type="button"
                onClick={regeneratePassword}
                className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Generate New
              </button>
            </div>
            <input
              type="text"
              required
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm font-mono text-amber-950 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs"
            />
          </div>

          {/* Madrasa Assignment Checkbox Section */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Assign to Madrasa(s)
              </label>
              {madrasas.length > 0 && (
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedMadrasaIds(madrasas.map((m) => m.id))}
                    className="text-emerald-800 hover:underline font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedMadrasaIds([])}
                    className="text-slate-500 hover:underline font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {madrasas.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-2">
                <p>
                  <strong>No madrasas created yet.</strong> You can register the teacher now and assign them to madrasas after adding institutions.
                </p>
                <Link
                  href="/admin/madrasas"
                  className="inline-flex items-center gap-1 font-bold text-amber-950 hover:underline text-xs"
                >
                  Go to Manage Madrasas <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                {madrasas.map((m) => {
                  const checked = selectedMadrasaIds.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white text-xs text-slate-800 cursor-pointer select-none transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMadrasaIds([...selectedMadrasaIds, m.id]);
                          } else {
                            setSelectedMadrasaIds(
                              selectedMadrasaIds.filter((id) => id !== m.id)
                            );
                          }
                        }}
                        className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-700 w-4 h-4 shrink-0"
                      />
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-slate-900">{m.name}</span>
                        {m.city && (
                          <span className="text-[11px] text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                            {m.city}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              className="w-full sm:w-auto h-11"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              className="w-full sm:w-auto h-11 font-bold"
            >
              Register Teacher
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Credentials Display Modal */}
      <Dialog
        isOpen={!!createdCredentials}
        onClose={() => setCreatedCredentials(null)}
        title="Teacher Account Credentials Provisioned"
        description="Share these login credentials securely with the educator. They will be prompted to set a permanent password upon first login."
        maxWidth="md"
      >
        {createdCredentials && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs sm:text-sm space-y-2 font-mono">
              <div className="flex justify-between items-center border-b border-emerald-100 pb-2">
                <span className="font-sans text-slate-600 text-xs">Educator Name:</span>
                <span className="font-sans font-bold text-slate-900">{createdCredentials.fullName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-emerald-100 pb-2">
                <span className="font-sans text-slate-600 text-xs">Username / Login ID:</span>
                <span className="text-emerald-950 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {createdCredentials.username}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-emerald-100 pb-2">
                <span className="font-sans text-slate-600 text-xs">Temporary Password:</span>
                <span className="text-amber-900 font-bold bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200">
                  {createdCredentials.temporaryPassword}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500 font-sans">
                <span>Login Portal:</span>
                <span className="text-emerald-800 font-semibold truncate max-w-[200px]">
                  {typeof window !== "undefined" ? `${window.location.origin}/login` : "/login"}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyCredentials}
                className="gap-2 h-11 sm:h-9 font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Details"}</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreatedCredentials(null)}
                className="h-11 sm:h-9 font-bold"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
