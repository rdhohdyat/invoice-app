"use client";

import React, { useState, useEffect, useCallback, Suspense, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { Button, Input, Select, useToast } from "@/app/components/ui";
import { createClient } from "@/utils/supabase/client";
import { Client, InvoiceStatus } from "@/app/lib/types";

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

function EditInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceIdParam = searchParams.get("id");

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);

  const [invoiceId, setInvoiceId] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("INV-2026-001");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [status, setStatus] = useState<InvoiceStatus>("draft");
  const [notes, setNotes] = useState<string>("");

  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountHolder, setAccountHolder] = useState<string>("");

  const [items, setItems] = useState<InvoiceLineItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(10);

  const { showToast } = useToast();
  const supabase = createClient();

  const fetchInvoiceData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Client list for dropdown
    const { data: clientList } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    if (clientList) setClients(clientList);

    // Find invoice to edit (by id query param or latest invoice)
    let query = supabase.from("invoices").select("*, invoice_items(*)").eq("user_id", user.id);

    if (invoiceIdParam) {
      query = query.eq("id", invoiceIdParam);
    } else {
      query = query.order("created_at", { ascending: false }).limit(1);
    }

    const { data: invData, error } = await query;

    if (error || !invData || invData.length === 0) {
      showToast("Invoice tidak ditemukan.", "error");
      setLoading(false);
      return;
    }

    const targetInv = invData[0];
    setInvoiceId(targetInv.id);
    setInvoiceNumber(targetInv.number);
    setSelectedClientId(targetInv.client_id || "");
    setInvoiceDate(targetInv.date);
    setDueDate(targetInv.due_date);
    setStatus(targetInv.status as InvoiceStatus);
    setNotes(targetInv.notes || "");
    setDiscount(Number(targetInv.discount) || 0);

    setBankName(targetInv.bank_name || "");
    setAccountNumber(targetInv.account_number || "");
    setAccountHolder(targetInv.account_holder || "");

    const sub = Number(targetInv.subtotal) || 0;
    const tx = Number(targetInv.tax) || 0;
    if (sub - Number(targetInv.discount) > 0) {
      setTaxRate(Math.round((tx / (sub - Number(targetInv.discount))) * 100));
    }

    if (targetInv.invoice_items && targetInv.invoice_items.length > 0) {
      const mappedItems: InvoiceLineItem[] = targetInv.invoice_items.map((it: { id: string; description: string; quantity: number; price: number }) => ({
        id: it.id,
        description: it.description,
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0,
      }));
      setItems(mappedItems);
    } else {
      setItems([{ id: "1", description: "Service Item", quantity: 1, price: 0 }]);
    }

    setLoading(false);
  }, [invoiceIdParam, supabase, showToast]);

  useEffect(() => {
    fetchInvoiceData();
  }, [fetchInvoiceData]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), description: "", quantity: 1, price: 0 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      showToast("Invoice minimal memiliki 1 item.", "warning");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const taxAmount = Math.round(((subtotal - discount) * taxRate) / 100);
  const total = Math.max(0, subtotal - discount + taxAmount);

  const handleUpdateInvoice = async () => {
    if (!invoiceId) return;
    if (!selectedClientId) {
      showToast("Pilih Client terlebih dahulu.", "warning");
      return;
    }

    setUpdating(true);

    // 1. Update Invoice main record
    const { error: invErr } = await supabase
      .from("invoices")
      .update({
        client_id: selectedClientId,
        date: invoiceDate,
        due_date: dueDate,
        status,
        subtotal,
        discount,
        tax: taxAmount,
        total,
        bank_name: bankName,
        account_number: accountNumber,
        account_holder: accountHolder,
        notes,
      })
      .eq("id", invoiceId);

    if (invErr) {
      showToast(invErr.message || "Gagal memperbarui invoice.", "error");
      setUpdating(false);
      return;
    }

    // 2. Refresh Invoice Items (Delete existing & re-insert)
    await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);

    const newItemsPayload = items.map((it) => ({
      invoice_id: invoiceId,
      description: it.description,
      quantity: it.quantity,
      price: it.price,
    }));

    const { error: itemsErr } = await supabase.from("invoice_items").insert(newItemsPayload);

    if (itemsErr) {
      showToast(itemsErr.message || "Gagal memperbarui item invoice.", "error");
    } else {
      showToast(`Invoice ${invoiceNumber} berhasil diperbarui!`, "success");
      router.push(`/invoices/${invoiceId}`);
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-gray-400">
        Memuat data edit invoice dari Supabase...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/invoices"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-1.5 cursor-pointer"
          >
            <Icon icon="solar:arrow-left-linear" /> Back to Invoices
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Edit Invoice {invoiceNumber}</h1>
        </div>
        <div className="flex gap-2.5">
          <Link href="/invoices">
            <Button variant="secondary">Cancel</Button>
          </Link>
          <Button
            variant="primary"
            icon="solar:disk-bold"
            isLoading={updating}
            onClick={handleUpdateInvoice}
          >
            Update Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Invoice Info */}
          <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Invoice Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Invoice Number" value={invoiceNumber} disabled />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Client *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  <option value="">-- Select Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Invoice Date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
              <Input
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "sent", label: "Sent" },
                  { value: "unpaid", label: "Unpaid" },
                  { value: "paid", label: "Paid" },
                  { value: "overdue", label: "Overdue" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Invoice Items</h3>
            <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 px-1 mb-2">
              <span className="col-span-5">Description</span>
              <span className="col-span-2">Quantity</span>
              <span className="col-span-2">Price</span>
              <span className="col-span-2">Total</span>
              <span className="col-span-1 text-right">Action</span>
            </div>
            <div className="space-y-2.5">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={item.description}
                    placeholder="Item description"
                    onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                    className="col-span-12 sm:col-span-5 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="col-span-4 sm:col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 text-center"
                  />
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) =>
                      handleItemChange(item.id, "price", parseInt(e.target.value) || 0)
                    }
                    className="col-span-5 sm:col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                  <span className="col-span-2 sm:col-span-2 text-sm font-medium text-gray-700 px-1">
                    Rp{(item.quantity * item.price).toLocaleString("id-ID")}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="col-span-1 text-gray-300 hover:text-red-500 p-1 rounded hover:bg-gray-100 flex items-center justify-center"
                  >
                    <Icon icon="solar:trash-bin-trash-linear" />
                  </button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-4"
              icon="solar:add-circle-bold"
              onClick={handleAddItem}
            >
              Add Item
            </Button>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Payment Bank Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Bank BCA"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 1234567890"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Account Holder</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="e.g. Ridho Hidayat"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Notes & Terms</h3>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 placeholder:text-gray-300"
            ></textarea>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-medium text-gray-800">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-gray-500">
                <span>Diskon (Rp)</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-28 px-2 py-1 rounded-lg border border-gray-200 text-right text-sm"
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-gray-500">
                <span>Pajak (%)</span>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 px-2 py-1 rounded-lg border border-gray-200 text-right text-sm"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Nominal Pajak</span>
                <span>Rp {taxAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-100 text-base font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-brand-600">Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full mt-6"
              isLoading={updating}
              onClick={handleUpdateInvoice}
            >
              Update Invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditInvoicePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-gray-400">Loading Edit Form...</div>}>
      <EditInvoiceContent />
    </Suspense>
  );
}
