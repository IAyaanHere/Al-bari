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
  Search,
  ExternalLink,
  School,
  AlertCircle,
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
  const [searchQuery, setSearchQuery] = React.useState<string>("");

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

    if (!name.trim()) {
      setError("Madrasa name is required.");
      return;
    }

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
      alert(err.message || "Failed to update status");
    }
  };

  const openEditModal = (madrasa: Madrasa) => {
    setEditingMadrasa(madrasa);
    setEditName(madrasa.name);
    setEditCity(madrasa.city || "");
    setEditContact(madrasa.contact_person || "");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMadrasa) return;
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

  const filteredMadrasas = madrasas.filter((m) => {
    return (
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.city && m.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.contact_person && m.contact_person.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-950 uppercase tracking-wider">
                Institutions
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">
                {madrasas.length} Registered
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-emerald-800 shrink-0" />
              <span>Madrasa & School Management</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Register institution branches. Google Drive storage folders are automatically organized for each campus.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setAddModalOpen(true)}
            className="w-full md:w-auto min-h-[46px] px-5 text-sm font-bold gap-2 shadow-sm rounded-xl shrink-0"
          >
            <Plus className="w-5 h-5 text-amber-300" />
            <span>Add New Madrasa</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search madrasa by name, city, or contact..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs"
        />
      </div>

      {isLoading ? (
        <div className="py-24 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-800" />
          <p className="text-xs font-medium text-slate-500">Loading institution branches...</p>
        </div>
      ) : filteredMadrasas.length === 0 ? (
        <div className="py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto border border-amber-100">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {searchQuery ? "No matching madrasas found" : "No madrasas added yet"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? "Try searching with a different campus name or city."
                : "Add your organization's first madrasa to enable direct upload organization on Google Drive."}
            </p>
          </div>
          {!searchQuery && (
            <Button
              variant="primary"
              onClick={() => setAddModalOpen(true)}
              className="gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Madrasa</span>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (Screens < 768px): Card based */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredMadrasas.map((madrasa) => (
              <div
                key={madrasa.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-base shrink-0">
                      <School className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {madrasa.name}
                      </h3>
                      {madrasa.city ? (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {madrasa.city}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-0.5">No location specified</p>
                      )}
                    </div>
                  </div>

                  {madrasa.active ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                      <XCircle className="w-3 h-3" /> Inactive
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      In-Charge
                    </span>
                    <span className="font-medium text-slate-800 truncate block mt-0.5">
                      {madrasa.contact_person || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Drive Folder
                    </span>
                    <span className="font-mono text-emerald-800 text-[11px] flex items-center gap-1 mt-0.5">
                      <FolderCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      {madrasa.drive_folder_id ? "Linked" : "Root Sync"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(madrasa)}
                    className="flex-1 text-xs font-semibold h-9 gap-1.5 text-slate-700"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(madrasa)}
                    className={`flex-1 text-xs font-semibold h-9 ${
                      madrasa.active
                        ? "text-rose-700 hover:bg-rose-50 border-rose-200"
                        : "text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    {madrasa.active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW (Screens >= 768px): Data Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-4 px-5">Madrasa / Campus Name</th>
                    <th className="py-4 px-5">Location / City</th>
                    <th className="py-4 px-5">In-Charge Contact</th>
                    <th className="py-4 px-5">Google Drive Status</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMadrasas.map((madrasa) => (
                    <tr key={madrasa.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <School className="w-4 h-4 text-emerald-800" />
                          <span>{madrasa.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-600 text-xs">
                        {madrasa.city || "-"}
                      </td>
                      <td className="py-4 px-5 text-slate-600 text-xs">
                        {madrasa.contact_person || "-"}
                      </td>
                      <td className="py-4 px-5 text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold">
                          <FolderCheck className="w-3.5 h-3.5 text-emerald-700" />
                          {madrasa.drive_folder_id ? "Folder Provisioned" : "Linked via Root"}
                        </span>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        {madrasa.active ? (
                          <Badge variant="success" className="gap-1 text-[11px]">
                            <CheckCircle className="w-3 h-3" />
                            <span>Active</span>
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="gap-1 text-[11px]">
                            <XCircle className="w-3 h-3" />
                            <span>Inactive</span>
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(madrasa)}
                          className="gap-1 text-slate-700 hover:text-slate-900"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(madrasa)}
                          className={
                            madrasa.active
                              ? "text-rose-600 hover:bg-rose-50 border-rose-200"
                              : "text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                          }
                        >
                          {madrasa.active ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Modal */}
      <Dialog
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Madrasa / Branch"
        description="Creates an academic institution campus and organizes storage."
        maxWidth="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Madrasa / School Name *"
            placeholder="e.g. Madrasa Darul Uloom Al-Bari"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="City / District"
            placeholder="e.g. Patna, Bihar"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <Input
            label="In-Charge / Administrator Contact"
            placeholder="e.g. Mufti Abdul Rahim (+91 98765 43210)"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              type="button"
              onClick={() => setAddModalOpen(false)}
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
              Create Madrasa
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        isOpen={!!editingMadrasa}
        onClose={() => setEditingMadrasa(null)}
        title="Edit Madrasa Details"
        description="Update campus name, location, and administrative contact."
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Madrasa Name *"
            required
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <Input
            label="City / Location"
            value={editCity}
            onChange={(e) => setEditCity(e.target.value)}
          />

          <Input
            label="In-Charge Contact"
            value={editContact}
            onChange={(e) => setEditContact(e.target.value)}
          />

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              type="button"
              onClick={() => setEditingMadrasa(null)}
              className="w-full sm:w-auto h-11"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSavingEdit}
              className="w-full sm:w-auto h-11 font-bold"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
