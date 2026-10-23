"use client";

import * as React from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Madrasa } from "@/types/database";
import { generateTemporaryPassword } from "@/lib/auth/passwords";
import { createClient } from "@/lib/supabase/client";

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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedMadrasaIds.length === 0) {
      setError("Please select at least one assigned madrasa.");
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

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Generate a new temporary password for this user?")) return;

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
    const text = `Al Bari Hub Teacher Login Credentials\nUsername: ${createdCredentials.username}\nTemporary Password: ${createdCredentials.temporaryPassword}\nLogin Portal: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Teacher & User Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provision teacher accounts, assign madrasas, manage active statuses, and initiate password resets.
          </p>
        </div>

        <Button variant="primary" onClick={openRegisterModal} className="gap-2">
          <UserPlus className="w-4 h-4" />
          <span>Register New Teacher</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-800" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3.5 px-4">Educator / Name</th>
                  <th className="py-3.5 px-4">Username</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Assigned Madrasas</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const assignedList =
                    user.teacher_madrasas?.map((tm) => tm.madrasa?.name).filter(Boolean) || [];

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {user.full_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">
                        {user.username || "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={user.role === "admin" ? "gold" : "default"}
                          className="capitalize text-[11px]"
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {user.role === "admin" ? (
                          <span className="text-emerald-800 font-semibold">All Madrasas (Admin)</span>
                        ) : assignedList.length > 0 ? (
                          <span>{assignedList.join(", ")}</span>
                        ) : (
                          <span className="text-amber-600">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
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
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        {user.role !== "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(user.id, user.active)}
                            className={user.active ? "text-rose-600 hover:bg-rose-50" : "text-emerald-700 hover:bg-emerald-50"}
                          >
                            {user.active ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetPassword(user.id)}
                          title="Generate new temporary password"
                        >
                          <KeyRound className="w-4 h-4 text-slate-500" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Teacher Modal */}
      <Dialog
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Register New Teacher Account"
        description="Administered registration with unique username and first-time temporary password."
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
              {error}
            </div>
          )}

          <Input
            label="Full Name"
            placeholder="e.g. Maulana Tariq Ahmad"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <Input
            label="Unique Username"
            placeholder="e.g. tariq_ahmad (lowercase alphanumeric, dots, underscores)"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
          />

          <Input
            label="Initial Temporary Password"
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Assign to Madrasa(s) *
            </label>
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
              {madrasas.map((m) => {
                const checked = selectedMadrasaIds.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMadrasaIds([...selectedMadrasaIds, m.id]);
                        } else {
                          setSelectedMadrasaIds(selectedMadrasaIds.filter((id) => id !== m.id));
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-700 w-4 h-4"
                    />
                    <span>{m.name} {m.city ? `(${m.city})` : ""}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" type="button" onClick={() => setRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
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
        description="Share these login credentials with the educator. They will be required to change their password upon first sign-in."
      >
        {createdCredentials && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs sm:text-sm space-y-2 font-mono">
              <p>
                <strong className="font-sans text-slate-600">Educator:</strong> {createdCredentials.fullName}
              </p>
              <p>
                <strong className="font-sans text-slate-600">Username:</strong>{" "}
                <span className="text-emerald-950 font-bold">{createdCredentials.username}</span>
              </p>
              <p>
                <strong className="font-sans text-slate-600">Temporary Password:</strong>{" "}
                <span className="text-amber-800 font-bold">{createdCredentials.temporaryPassword}</span>
              </p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" onClick={copyCredentials} className="gap-1.5">
                {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied!" : "Copy Details"}</span>
              </Button>

              <Button variant="primary" size="sm" onClick={() => setCreatedCredentials(null)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
