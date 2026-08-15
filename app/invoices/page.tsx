"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button, StatusBadge, Input, Modal, useToast } from "@/app/components/ui";
import { createClient } from "@/utils/supabase/client";
import { InvoiceStatus } from "@/app/lib/types";

export interface InvoiceDisplayItem {
  id: string;
  number: string;
  clientName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceDisplayItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const { showToast } = useToast();
  const supabase = createClient();

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: fetchErr } = await supabase
      .from("invoices")
      .select("*, clients(name, company)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchErr) {
      console.error(fetchErr);
      setError(true);
      showToast("Gagal mengambil data invoice.", "error");
    } else if (data) {
      const mapped: InvoiceDisplayItem[] = data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        clientName: inv.clients?.name || inv.clients?.company || "Unspecified Client",
        date: inv.date,
        dueDate: inv.due_date,
        amount: Number(inv.total) || 0,
        status: inv.status as InvoiceStatus,
      }));
      setInvoices(mapped);
    }
    setLoading(false);
  }, [supabase, showToast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDeleteInvoice = async () => {
    if (selectedInvoiceId) {
      const { error: delErr } = await supabase
        .from("invoices")
        .delete()
        .eq("id", selectedInvoiceId);

      if (delErr) {
        showToast(delErr.message || "Gagal menghapus invoice.", "error");
      } else {
        showToast("Invoice berhasil dihapus.", "info");
        fetchInvoices();
      }
    }
    setActiveModal(null);
    setSelectedInvoiceId(null);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "All" || inv.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create and manage invoices for your clients.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/invoices/create">
            <Button variant="primary" icon="solar:add-circle-bold">
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft overflow-hidden">
        {/* Search & Filter Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-gray-100">
          <div className="max-w-xs w-full">
            <Input
              placeholder="Search invoices..."
              icon="solar:magnifer-linear"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["All", "Draft", "Sent", "Unpaid", "Paid", "Overdue", "Cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${filterStatus === status
                    ? "bg-brand-600 text-white"
                    : "text-gray-500 hover:bg-gray-50"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* State 1: Loading Skeleton */}
        {loading && (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400 mt-2">Memuat data invoice dari Supabase...</p>
          </div>
        )}

        {/* State 2: Error State */}
        {!loading && error && (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
              <Icon icon="solar:danger-triangle-bold" className="text-2xl" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">Gagal Memuat Data</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              Terjadi kesalahan saat menghubungkan ke database Supabase.
            </p>
            <Button variant="secondary" size="sm" className="mt-4" icon="solar:restart-bold" onClick={fetchInvoices}>
              Coba Lagi
            </Button>
          </div>
        )}

        {/* State 3: Empty State */}
        {!loading && !error && filteredInvoices.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Icon icon="solar:document-text-linear" className="text-2xl" />
            </div>
            <h3 className="font-semibold text-gray-700 text-sm">Belum Ada Invoice</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              {searchQuery || filterStatus !== "All"
                ? "Tidak ada invoice yang cocok dengan pencarian atau filter."
                : "Belum ada invoice yang dibuat. Klik 'Create Invoice' untuk membuat invoice pertama."}
            </p>
            <Link href="/invoices/create" className="inline-block mt-4">
              <Button variant="primary" size="sm" icon="solar:add-circle-bold">
                Create Invoice
              </Button>
            </Link>
          </div>
        )}

        {/* State 4: Data Table */}
        {!loading && !error && filteredInvoices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                  <th className="font-medium px-5 py-3">Invoice</th>
                  <th className="font-medium px-5 py-3">Client</th>
                  <th className="font-medium px-5 py-3">Date</th>
                  <th className="font-medium px-5 py-3">Due Date</th>
                  <th className="font-medium px-5 py-3">Amount</th>
                  <th className="font-medium px-5 py-3">Status</th>
                  <th className="font-medium px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-5 py-3.5 font-medium text-gray-800">{inv.number}</td>
                    <td className="px-5 py-3.5 text-gray-600">{inv.clientName}</td>
                    <td className="px-5 py-3.5 text-gray-500">{inv.date}</td>
                    <td className="px-5 py-3.5 text-gray-500">{inv.dueDate}</td>
                    <td className="px-5 py-3.5 text-gray-800 font-medium">
                      Rp {inv.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/invoices/${inv.id}`}
                          title="View Invoice"
                          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-600 cursor-pointer"
                        >
                          <Icon icon="solar:eye-linear" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedInvoiceId(inv.id);
                            setActiveModal("modal-delete");
                          }}
                          title="Delete Invoice"
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={activeModal === "modal-delete"}
        onClose={() => setActiveModal(null)}
        title="Delete Invoice"
        maxWidth="sm"
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
            <Icon icon="solar:danger-triangle-bold" className="text-2xl" />
          </div>
          <p className="text-sm text-gray-600">
            Apakah kamu yakin ingin menghapus invoice ini? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-2.5 mt-5">
            <Button variant="secondary" className="flex-1" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDeleteInvoice}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
