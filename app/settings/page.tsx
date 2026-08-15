"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Button, useToast } from "@/app/components/ui";
import { createClient } from "@/utils/supabase/client";

type SettingsTab = "profile" | "business" | "payment";

export default function SettingsPage() {
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });

  const { showToast } = useToast();
  const supabase = createClient();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setForm({
      fullName: profile?.full_name || "",
      email: profile?.email || user.email || "",
      phone: profile?.phone || "",
      companyName: profile?.company_name || "",
      bankName: profile?.bank_name || "",
      accountNumber: profile?.account_number || "",
      accountHolder: profile?.account_holder || "",
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Sesi telah berakhir, silakan login kembali.", "error");
      setSaving(false);
      return;
    }

    const payload = {
      id: user.id,
      full_name: form.fullName,
      email: form.email,
      phone: form.phone,
      company_name: form.companyName,
      bank_name: form.bankName,
      account_number: form.accountNumber,
      account_holder: form.accountHolder,
    };

    // Check if profile exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    let error;
    if (existing) {
      const res = await supabase.from("profiles").update(payload).eq("id", user.id);
      error = res.error;
    } else {
      const res = await supabase.from("profiles").insert(payload);
      error = res.error;
    }

    if (error) {
      console.error(error);
      showToast(error.message || "Gagal menyimpan perubahan profil.", "error");
    } else {
      showToast("Pengaturan berhasil disimpan!", "success");
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account and business preferences.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-gray-400">Memuat profil dari Supabase...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-2 flex lg:flex-col gap-1 overflow-x-auto">
              <button
                onClick={() => setSettingsTab("profile")}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-left shrink-0 cursor-pointer ${
                  settingsTab === "profile" ? "bg-brand-50 text-brand-600" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon icon="solar:user-bold-duotone" /> Profile
              </button>
              <button
                onClick={() => setSettingsTab("business")}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-left shrink-0 cursor-pointer ${
                  settingsTab === "business" ? "bg-brand-50 text-brand-600" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon icon="solar:buildings-2-bold-duotone" /> Business
              </button>
              <button
                onClick={() => setSettingsTab("payment")}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-left shrink-0 cursor-pointer ${
                  settingsTab === "payment" ? "bg-brand-50 text-brand-600" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon icon="solar:card-bold-duotone" /> Payment
              </button>
            </div>
          </div>

          <div className="lg:col-span-3">
            {settingsTab === "profile" && (
              <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Profile</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-xl">
                    {(form.fullName || "F").charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      readOnly
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+62 812 0000 0000"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                </div>
                <Button variant="primary" className="mt-6" isLoading={saving} onClick={handleSaveProfile}>
                  Save Changes
                </Button>
              </div>
            )}

            {settingsTab === "business" && (
              <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Business</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Business / Studio Name</label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      placeholder="e.g. Ridho Software Studio"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                </div>
                <Button variant="primary" className="mt-6" isLoading={saving} onClick={handleSaveProfile}>
                  Save Changes
                </Button>
              </div>
            )}

            {settingsTab === "payment" && (
              <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Payment & Bank Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Bank Name</label>
                    <input
                      type="text"
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      placeholder="e.g. Bank BCA"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Account Number</label>
                    <input
                      type="text"
                      value={form.accountNumber}
                      onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                      placeholder="e.g. 1234567890"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Account Holder Name</label>
                    <input
                      type="text"
                      value={form.accountHolder}
                      onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                      placeholder="e.g. Ridho Hidayat"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                </div>
                <Button variant="primary" className="mt-6" isLoading={saving} onClick={handleSaveProfile}>
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
