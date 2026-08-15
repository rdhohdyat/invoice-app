"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button, Input, Modal, useToast } from "@/app/components/ui";
import { createClient } from "@/utils/supabase/client";
import { Client as SupabaseClient } from "@/app/lib/types";

export interface ClientItem extends SupabaseClient {
  invoicesCount?: number;
  totalRevenue?: number;
  avatar: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Form State for Add / Edit
  const [clientForm, setClientForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const { showToast } = useToast();
  const supabase = createClient();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      showToast(error.message || "Gagal mengambil data klien", "error");
    } else if (data) {
      const mapped: ClientItem[] = data.map((c) => ({
        ...c,
        invoicesCount: 0,
        totalRevenue: 0,
        avatar: (c.name || "C").charAt(0).toUpperCase(),
      }));
      setClients(mapped);
    }
    setLoading(false);
  }, [supabase, showToast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const openAddModal = () => {
    setEditingClient(null);
    setClientForm({ name: "", company: "", email: "", phone: "", address: "", notes: "" });
    setActiveModal("modal-client-form");
  };

  const openEditModal = (client: ClientItem) => {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      company: client.company || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      notes: client.notes || "",
    });
    setActiveModal("modal-client-form");
  };

  const handleSaveClient = async () => {
    if (!clientForm.name) {
      showToast("Nama klien wajib diisi.", "warning");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Sesi telah berakhir, silakan login kembali.", "error");
      return;
    }

    if (editingClient) {
      // Edit mode in Supabase
      const { error } = await supabase
        .from("clients")
        .update({
          name: clientForm.name,
          company: clientForm.company,
          email: clientForm.email,
          phone: clientForm.phone,
          address: clientForm.address,
          notes: clientForm.notes,
        })
        .eq("id", editingClient.id);

      if (error) {
        showToast(error.message || "Gagal memperbarui klien.", "error");
      } else {
        showToast(`Client ${clientForm.name} berhasil diperbarui!`, "success");
        fetchClients();
      }
    } else {
      // Add mode in Supabase
      const { error } = await supabase.from("clients").insert({
        user_id: user.id,
        name: clientForm.name,
        company: clientForm.company,
        email: clientForm.email,
        phone: clientForm.phone,
        address: clientForm.address,
        notes: clientForm.notes,
      });

      if (error) {
        showToast(error.message || "Gagal menambahkan klien.", "error");
      } else {
        showToast(`Client ${clientForm.name} berhasil ditambahkan!`, "success");
        fetchClients();
      }
    }

    setActiveModal(null);
    setEditingClient(null);
  };

  const handleDeleteClient = async () => {
    if (deletingClientId) {
      const { error } = await supabase.from("clients").delete().eq("id", deletingClientId);
      if (error) {
        showToast(error.message || "Gagal menghapus klien.", "error");
      } else {
        showToast("Client berhasil dihapus", "info");
        fetchClients();
      }
    }
    setActiveModal(null);
    setDeletingClientId(null);
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your clients and their information.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" icon="solar:add-circle-bold" onClick={openAddModal}>
            Add Client
          </Button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-gray-100">
          <div className="relative w-full sm:w-72">
            <Icon
              icon="solar:magnifer-linear"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 placeholder:text-gray-300"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
              <Icon icon="solar:filter-linear" /> Filter
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
              <Icon icon="solar:sort-vertical-linear" /> Sort
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400 mt-2">Memuat data clients dari Supabase...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredClients.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Icon icon="solar:users-group-two-rounded-linear" className="text-2xl" />
            </div>
            <h3 className="font-semibold text-gray-700 text-sm">Tidak Ada Client</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              {searchQuery ? "Pencarian tidak menemukan client." : "Belum ada client terdaftar. Klik 'Add Client' untuk menambahkan."}
            </p>
            {!searchQuery && (
              <Button variant="primary" size="sm" className="mt-4" icon="solar:add-circle-bold" onClick={openAddModal}>
                Add Client
              </Button>
            )}
          </div>
        )}

        {/* Table Content */}
        {!loading && filteredClients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                  <th className="font-medium px-5 py-3">Client</th>
                  <th className="font-medium px-5 py-3">Email</th>
                  <th className="font-medium px-5 py-3">Phone</th>
                  <th className="font-medium px-5 py-3">Address</th>
                  <th className="font-medium px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-xs shrink-0">
                          {client.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{client.name}</p>
                          <p className="text-xs text-gray-400">{client.company || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{client.email || "-"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{client.phone || "-"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{client.address || "-"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/clients/detail?id=${client.id}`}
                          title="View Detail"
                          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-600 cursor-pointer"
                        >
                          <Icon icon="solar:eye-linear" />
                        </Link>
                        <button
                          onClick={() => openEditModal(client)}
                          title="Edit Client"
                          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-600 cursor-pointer"
                        >
                          <Icon icon="solar:pen-2-linear" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingClientId(client.id);
                            setActiveModal("modal-delete");
                          }}
                          title="Delete Client"
                          className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600 cursor-pointer"
                        >
                          <Icon icon="solar:trash-bin-trash-linear" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Client Modal */}
      <Modal
        isOpen={activeModal === "modal-client-form"}
        onClose={() => setActiveModal(null)}
        title={editingClient ? "Edit Client" : "Add New Client"}
        maxWidth="md"
      >
        <div className="space-y-3.5">
          <Input
            label="Full Name *"
            placeholder="John Doe"
            value={clientForm.name}
            onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
          />
          <Input
            label="Company"
            placeholder="ABC Company"
            value={clientForm.company}
            onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            value={clientForm.email}
            onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
          />
          <Input
            label="Phone"
            placeholder="+62 812 3456 7890"
            value={clientForm.phone}
            onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
          />
          <Input
            label="Address"
            placeholder="Jakarta, Indonesia"
            value={clientForm.address}
            onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
          />
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
            <textarea
              rows={3}
              placeholder="Tambahkan catatan khusus mengenai klien ini..."
              value={clientForm.notes}
              onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 placeholder:text-gray-300"
            ></textarea>
          </div>
        </div>
        <div className="flex gap-2.5 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => setActiveModal(null)}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSaveClient}>
            {editingClient ? "Update Client" : "Save Client"}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={activeModal === "modal-delete"}
        onClose={() => setActiveModal(null)}
        title="Delete Client"
        maxWidth="sm"
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
            <Icon icon="solar:danger-triangle-bold" className="text-2xl" />
          </div>
          <p className="text-sm text-gray-600">
            Apakah kamu yakin ingin menghapus client ini? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-2.5 mt-5">
            <Button variant="secondary" className="flex-1" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDeleteClient}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
