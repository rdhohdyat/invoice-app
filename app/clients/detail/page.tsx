"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { Button, StatusBadge, Input, Modal, useToast } from "@/app/components/ui";
import { createClient } from "@/utils/supabase/client";
import { InvoiceStatus } from "@/app/lib/types";

export interface ClientDetailData {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  avatar: string;
}

interface ClientInvoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: InvoiceStatus;
}

function ClientDetailContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("id");

  const [client, setClient] = useState<ClientDetailData | null>(null);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [stats, setStats] = useState({
    totalInvoicesCount: 0,
    totalPaid: 0,
    outstanding: 0,
  });

  // Form State for editing
  const [editForm, setEditForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const { showToast } = useToast();
  const supabase = createClient();

  const fetchClientDetails = useCallback(async () => {
    setLoading(true);

    if (!clientId) {
      // Fallback or demo client if no id param present
      setClient({
        id: "demo",
        name: "John Doe",
        company: "ABC Company",
        email: "john@example.com",
        phone: "+62 812 3456 7890",
        address: "Jakarta, Indonesia",
        notes: "Primary contact for Web & Mobile UI development projects.",
        avatar: "J",
      });
      setInvoices([]);
      setLoading(false);
      return;
    }

    // 1. Fetch Client Profile from Supabase
    const { data: clientData, error: clientErr } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientErr || !clientData) {
      showToast("Client tidak ditemukan.", "error");
      setLoading(false);
      return;
    }

    setClient({
      id: clientData.id,
      name: clientData.name,
      company: clientData.company || "-",
      email: clientData.email || "-",
      phone: clientData.phone || "-",
      address: clientData.address || "-",
      notes: clientData.notes || "",
      avatar: (clientData.name || "C").charAt(0).toUpperCase(),
    });

    setEditForm({
      name: clientData.name,
      company: clientData.company || "",
      email: clientData.email || "",
      phone: clientData.phone || "",
      address: clientData.address || "",
      notes: clientData.notes || "",
    });

    // 2. Fetch Invoices for this Client from Supabase
    const { data: invData } = await supabase
      .from("invoices")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (invData) {
      let paidSum = 0;
      let outSum = 0;

      const mapped: ClientInvoice[] = invData.map((inv) => {
        const amt = Number(inv.total) || 0;
        if (inv.status === "paid") {
          paidSum += amt;
        } else if (inv.status === "unpaid" || inv.status === "sent" || inv.status === "overdue") {
          outSum += amt;
        }
        return {
          id: inv.id,
          number: inv.number,
          date: inv.date,
          amount: amt,
          status: inv.status as InvoiceStatus,
        };
      });

      setInvoices(mapped);
      setStats({
        totalInvoicesCount: mapped.length,
        totalPaid: paidSum,
        outstanding: outSum,
      });
    }

    setLoading(false);
  }, [clientId, supabase, showToast]);

  useEffect(() => {
    fetchClientDetails();
  }, [fetchClientDetails]);

  const handleOpenEditModal = () => {
    if (client) {
      setEditForm({
        name: client.name,
        company: client.company === "-" ? "" : client.company,
        email: client.email === "-" ? "" : client.email,
        phone: client.phone === "-" ? "" : client.phone,
        address: client.address === "-" ? "" : client.address,
        notes: client.notes || "",
      });
    }
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!client) return;

    const { error } = await supabase
      .from("clients")
      .update({
        name: editForm.name,
        company: editForm.company,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
        notes: editForm.notes,
      })
      .eq("id", client.id);

    if (error) {
      showToast(error.message || "Gagal memperbarui profil client.", "error");
    } else {
      showToast(`Profil ${editForm.name} berhasil diperbarui!`, "success");
      fetchClientDetails();
    }
    setIsEditModalOpen(false);
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-400 mt-2">Memuat detail client dari Supabase...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-12 text-center text-gray-500">
        Client tidak ditemukan.{" "}
        <Link href="/clients" className="text-brand-600 underline">
          Kembali ke Clients
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button Header */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/clients"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <Icon icon="solar:arrow-left-linear" /> Back to Clients
        </Link>

        <Button variant="secondary" size="sm" icon="solar:pen-2-linear" onClick={handleOpenEditModal}>
          Edit Client Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Client Profile Info Card */}
        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-xl2 shadow-soft p-5 h-fit">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-lg">
              {client.avatar}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{client.name}</h3>
              <p className="text-xs text-gray-400">{client.company}</p>
            </div>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex items-center gap-2.5 text-gray-600">
              <Icon icon="solar:letter-linear" className="text-gray-400 text-base shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-gray-600">
              <Icon icon="solar:phone-linear" className="text-gray-400 text-base shrink-0" />
              <span>{client.phone}</span>
            </div>
            <div className="flex items-center gap-2.5 text-gray-600">
              <Icon icon="solar:map-point-linear" className="text-gray-400 text-base shrink-0" />
              <span>{client.address}</span>
            </div>
          </div>

          {client.notes && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-400 mb-1">Notes</p>
              <p className="text-xs text-gray-600 leading-relaxed">{client.notes}</p>
            </div>
          )}

          <Button
            variant="secondary"
            className="w-full mt-5"
            icon="solar:pen-2-linear"
            onClick={handleOpenEditModal}
          >
            Edit Client
          </Button>
        </div>

        {/* Right Column: Statistics & Invoice History */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stat Overview Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-4">
              <p className="text-xs text-gray-400 mb-1">Total Invoices</p>
              <p className="text-lg font-semibold text-gray-900">{stats.totalInvoicesCount}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-4">
              <p className="text-xs text-gray-400 mb-1">Total Paid</p>
              <p className="text-lg font-semibold text-emerald-600">
                Rp {stats.totalPaid.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-4">
              <p className="text-xs text-gray-400 mb-1">Outstanding</p>
              <p className="text-lg font-semibold text-amber-600">
                Rp {stats.outstanding.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {/* Invoice History Table */}
          <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Invoice History</h3>
              <Link href="/invoices/create">
                <Button variant="primary" size="sm" icon="solar:add-circle-bold">
                  Create Invoice
                </Button>
              </Link>
            </div>

            {invoices.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Belum ada riwayat invoice untuk klien ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                      <th className="font-medium px-5 py-3">Invoice</th>
                      <th className="font-medium px-5 py-3">Date</th>
                      <th className="font-medium px-5 py-3">Amount</th>
                      <th className="font-medium px-5 py-3">Status</th>
                      <th className="font-medium px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/60 transition">
                        <td className="px-5 py-3.5 font-medium text-gray-800">{inv.number}</td>
                        <td className="px-5 py-3.5 text-gray-500">{inv.date}</td>
                        <td className="px-5 py-3.5 text-gray-800">
                          Rp {inv.amount.toLocaleString("id-ID")}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="text-gray-400 hover:text-brand-600 cursor-pointer inline-flex items-center justify-center p-1 rounded-lg hover:bg-gray-100"
                          >
                            <Icon icon="solar:eye-linear" className="text-lg" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Client Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Client Information"
        maxWidth="md"
      >
        <div className="space-y-3.5">
          <Input
            label="Full Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <Input
            label="Company"
            value={editForm.company}
            onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          />
          <Input
            label="Phone"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <Input
            label="Address"
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
          />
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
            <textarea
              rows={3}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 placeholder:text-gray-300"
            ></textarea>
          </div>
        </div>
        <div className="flex gap-2.5 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => setIsEditModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSaveEdit}>
            Update Information
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default function ClientDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-gray-400">
          Loading Client Details...
        </div>
      }
    >
      <ClientDetailContent />
    </Suspense>
  );
}
