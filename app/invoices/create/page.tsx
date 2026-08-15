"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Button, useToast } from "@/app/components/ui";
import { createClient } from "@/utils/supabase/client";
import { Client, Service } from "@/app/lib/types";

interface InvoiceFormItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const supabase = createClient();

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form states
  const [invoiceNumber] = useState<string>(`INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [items, setItems] = useState<InvoiceFormItem[]>([
    { id: "1", description: "Website Development", quantity: 1, price: 3000000 },
  ]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(11); // 11% tax default
  const [notes, setNotes] = useState<string>("Thank you for your business.");

  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountHolder, setAccountHolder] = useState<string>("");

  // Fetch clients, services, and default bank info from Supabase Profile
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [clientsRes, servicesRes, profileRes] = await Promise.all([
        supabase.from("clients").select("*").eq("user_id", user.id).order("name"),
        supabase.from("services").select("*").eq("user_id", user.id).order("name"),
        supabase.from("profiles").select("bank_name, account_number, account_holder").eq("id", user.id).maybeSingle(),
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      if (profileRes.data) {
        setBankName(profileRes.data.bank_name || "");
        setAccountNumber(profileRes.data.account_number || "");
        setAccountHolder(profileRes.data.account_holder || "");
      }
      setLoadingOptions(false);
    }
    loadData();
  }, [supabase]);

  // Item calculations
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const taxAmount = Math.round(((subtotal - discount) * taxRate) / 100);
  const total = Math.max(0, subtotal - discount + taxAmount);

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

  const handleSelectService = (index: number, serviceId: string) => {
    const srv = services.find((s) => s.id === serviceId);
    if (!srv) return;
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, description: srv.name, price: Number(srv.price) || 0 } : item
      )
    );
  };

  const handleSaveInvoice = async (status: "draft" | "sent" | "paid" = "sent") => {
    if (!selectedClientId) {
      showToast("Pilih Klien terlebih dahulu.", "warning");
      return;
    }
    if (items.some((i) => !i.description.trim())) {
      showToast("Deskripsi semua item wajib diisi.", "warning");
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Sesi berakhir, silakan login kembali.", "error");
      setSaving(false);
      return;
    }

    // 1. Insert Invoice Record
    const { data: invoiceData, error: invoiceErr } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
        client_id: selectedClientId,
        number: invoiceNumber,
        status,
        date,
        due_date: dueDate,
        subtotal,
        discount,
        tax: taxAmount,
        total,
        bank_name: bankName,
        account_number: accountNumber,
        account_holder: accountHolder,
        notes,
      })
      .select("id")
      .single();

    if (invoiceErr || !invoiceData) {
      showToast(invoiceErr?.message || "Gagal membuat invoice.", "error");
      setSaving(false);
      return;
    }

    // 2. Insert Invoice Items
    const invoiceItemsData = items.map((item) => ({
      invoice_id: invoiceData.id,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsErr } = await supabase.from("invoice_items").insert(invoiceItemsData);

    if (itemsErr) {
      showToast(itemsErr.message || "Gagal menyimpan detail item invoice.", "error");
    } else {
      showToast(`Invoice ${invoiceNumber} berhasil dibuat!`, "success");
      router.push(`/invoices/${invoiceData.id}`);
    }
    setSaving(false);
  };

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
          <h1 className="text-xl font-semibold text-gray-900">Create Invoice</h1>
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            isLoading={saving}
            onClick={() => handleSaveInvoice("draft")}
          >
            Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={saving}
            onClick={() => handleSaveInvoice("sent")}
          >
            Save & Send
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Invoice Header Form */}
          <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Invoice Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  readOnly
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Client *</label>
                <div className="relative">
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    <option value="">-- Pilih Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""}
                      </option>
                    ))}
                  </select>
                  <Icon
                    icon="solar:alt-arrow-down-linear"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                {!loadingOptions && clients.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Belum ada client. Tambahkan di menu Clients terlebih dahulu.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Invoice Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">Invoice Items</h3>
              {services.length > 0 && (
                <span className="text-xs text-gray-400">Pilih dari Master Service atau ketik manual</span>
              )}
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 space-y-2">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-12 sm:col-span-6">
                      <input
                        type="text"
                        placeholder="Deskripsi item / pekerjaan"
                        value={item.description}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((it, i) => (i === index ? { ...it, description: e.target.value } : it))
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
                      />
                    </div>
                    {services.length > 0 && (
                      <div className="col-span-12 sm:col-span-6">
                        <select
                          onChange={(e) => handleSelectService(index, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-500"
                        >
                          <option value="">-- Impor dari Service --</option>
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} (Rp {s.price.toLocaleString("id-ID")})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-12 gap-2 items-center pt-1">
                    <div className="col-span-4 sm:col-span-3">
                      <label className="block text-[10px] text-gray-400 mb-0.5">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((it, i) =>
                              i === index ? { ...it, quantity: Math.max(1, parseInt(e.target.value) || 1) } : it
                            )
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white text-center focus:outline-none focus:ring-2 focus:ring-brand-200"
                      />
                    </div>
                    <div className="col-span-7 sm:col-span-5">
                      <label className="block text-[10px] text-gray-400 mb-0.5">Harga Satuan (Rp)</label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((it, i) =>
                              i === index ? { ...it, price: parseInt(e.target.value) || 0 } : it
                            )
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-3 flex items-center justify-between pt-2 sm:pt-0">
                      <div>
                        <span className="block text-[10px] text-gray-400">Total Item</span>
                        <span className="text-sm font-semibold text-gray-800">
                          Rp {(item.quantity * item.price).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-200 cursor-pointer"
                      >
                        <Icon icon="solar:trash-bin-trash-linear" className="text-lg" />
                      </button>
                    </div>
                  </div>
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
            <p className="text-xs text-gray-400 mb-4">
              Informasi rekening ini diambil dari Settings, tetapi dapat Anda sesuaikan khusus untuk invoice ini.
            </p>
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
              placeholder="Catatan tambahan untuk invoice ini..."
            ></textarea>
          </div>
        </div>

        {/* Right Summary Column */}
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
              isLoading={saving}
              onClick={() => handleSaveInvoice("sent")}
            >
              Save & Send Invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
