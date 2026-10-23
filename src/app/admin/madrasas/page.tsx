"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  RefreshCw,
  Edit,
  FolderCheck,
  CheckCircle,
  XCircle,
  MapPin,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Madrasa } from "@/types/database";

export default function AdminMadrasasPage() {
  const router = useRouter();

  const [madrasas, setMadrasas] = React.useState<Madrasa[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Add modal state
  const [addModalOpen, setAddModalOpen] = React.useState<boolean>(false);
  const [name, setName] = React.useState<string>("");
  const [city, setCity] = React.useState<string>("");
  const [contactPerson, setContactPerson] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Edit modal state
  const [editingMadrasa, setEditingMadrasa] = React.useState<Madrasa | null>(null);
  const [editName, setEditName] = React.useState<string>("");
  const [editCity, setEditCity] = React.useState<string>("");
  const [editContact, setEditContact] = React.useState<string>("");
  const [isSavingEdit, setIsSavingEdit] = React.useState<boolean>(false);

  const fetchMadrasas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/madrasas");
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      if (data.madrasas) setMadrasas(data.madrasas);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMadrasas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/madrasas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim(),
          contactPerson: contactPerson.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create madrasa");

      setAddModalOpen(false);
      setName("");
      setCity("");
      setContactPerson("");
      fetchMadrasas();
    } catch (err: any) {
      setError(err.message || "Error adding madrasa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (madrasa: Madrasa) => {
    try {
      const res = await fetch(`/api/admin/madrasas/${madrasa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !madrasa.active }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setMadrasas((prev) =>
        prev.map((m) => (m.id === madrasa.id ? { ...m, active: !m.active } : m))
      );
    } catch (err: any) {
      alert(err.message || "Failed to toggle madrasa active state");
    }
  };

  const openEditModal = (madrasa: Madrasa) => {
    setEditingMadrasa(madrasa);
    setEditName(madrasa.name);
    setEditCity(madrasa.city || "");
    setEditContact(madrasa.contact_person || "");
  };

  const handleSaveEdit = async () => {
    if (!editingMadrasa || !editName.trim()) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch(`/api/admin/madrasas/${editingMadrasa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          city: editCity.trim(),
          contactPerson: editContact.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to update madrasa");
      setMadrasas((prev) =>
        prev.map((m) =>
          m.id === editingMadrasa.id
            ? { ...m, name: editName, city: editCity, contact_person: editContact }
            : m
        )
      );
      setEditingMadrasa(null);
    } catch (err: any) {
      alert(err.message || "Failed to update madrasa");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Madrasa & School Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register institution branches, automatically provision Google Drive storage folders, and control upload permissions.
          </p>
        </div>

        <Button variant="primary" onClick={() => setAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>Add New Madrasa</span>
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
                  <th className="py-3.5 px-4">Madrasa Name</th>
                  <th className="py-3.5 px-4">City / Location</th>
                  <th className="py-3.5 px-4">In-Charge Contact</th>
                  <th className="py-3.5 px-4">Drive Folder</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {madrasas.map((madrasa) => (
                  <tr key={madrasa.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {madrasa.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {madrasa.city || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {madrasa.contact_person || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-emerald-800">
                      <div className="flex items-center gap-1.5">
                        <FolderCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[120px]">{madrasa.drive_folder_id || "Provisioned"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {madrasa.active ? (
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(madrasa)}
                        className={madrasa.active ? "text-rose-600 hover:bg-rose-50" : "text-emerald-700 hover:bg-emerald-50"}
                      >
                        {madrasa.active ? "Deactivate" : "Activate"}
                      </Button>
                      <button
                        onClick={() => openEditModal(madrasa)}
                        className="p-1.5 text-slate-400 hover:text-emerald-800 rounded"
                        title="Edit Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Madrasa Modal */}
      <Dialog
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register Affiliated Madrasa"
        description="Creates database record and automatically provisions its dedicated Google Drive root directory."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
              {error}
            </div>
          )}

          <Input
            label="Madrasa / School Name"
            placeholder="e.g. Madrasa Darul Uloom Al-Bari"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="City / District"
            placeholder="e.g. Lucknow, UP"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <Input
            label="Contact Person / Headmaster"
            placeholder="e.g. Maulana Qasim"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" type="button" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Provision Madrasa
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Madrasa Modal */}
      <Dialog
        isOpen={!!editingMadrasa}
        onClose={() => setEditingMadrasa(null)}
        title="Edit Madrasa Information"
      >
        <div className="space-y-4">
          <Input
            label="Madrasa Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />

          <Input
            label="City / Location"
            value={editCity}
            onChange={(e) => setEditCity(e.target.value)}
          />

          <Input
            label="Contact Person"
            value={editContact}
            onChange={(e) => setEditContact(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setEditingMadrasa(null)}>
              Cancel
            </Button>
            <Button variant="primary" isLoading={isSavingEdit} onClick={handleSaveEdit}>
              Save
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
