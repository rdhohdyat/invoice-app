"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Button, Input, Modal, useToast } from "@/app/components/ui";
import { createClient } from "@/utils/supabase/client";
import { Service as SupabaseService } from "@/app/lib/types";

export interface ServiceItem extends SupabaseService {
  icon: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Form State
  const [serviceForm, setServiceForm] = useState<{ title: string; desc: string; price: string }>({
    title: "",
    desc: "",
    price: "",
  });
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  const { showToast } = useToast();
  const supabase = createClient();

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      showToast(error.message || "Gagal mengambil data layanan.", "error");
    } else if (data) {
      const mapped: ServiceItem[] = data.map((s) => ({
        ...s,
        icon: "solar:box-bold-duotone",
      }));
      setServices(mapped);
    }
    setLoading(false);
  }, [supabase, showToast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openAddModal = () => {
    setEditingService(null);
    setServiceForm({ title: "", desc: "", price: "" });
    setActiveModal("modal-service-form");
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setServiceForm({
      title: service.name,
      desc: service.description || "",
      price: String(service.price),
    });
    setActiveModal("modal-service-form");
  };

  const handleSaveService = async () => {
    if (!serviceForm.title) {
      showToast("Nama layanan wajib diisi.", "warning");
      return;
    }

    const parsedPrice = parseInt(serviceForm.price.replace(/\D/g, "")) || 0;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Sesi telah berakhir, silakan login kembali.", "error");
      return;
    }

    if (editingService) {
      // Edit mode in Supabase
      const { error } = await supabase
        .from("services")
        .update({
          name: serviceForm.title,
          description: serviceForm.desc,
          price: parsedPrice,
        })
        .eq("id", editingService.id);

      if (error) {
        showToast(error.message || "Gagal memperbarui layanan.", "error");
      } else {
        showToast(`Layanan ${serviceForm.title} berhasil diperbarui!`, "success");
        fetchServices();
      }
    } else {
      // Add mode in Supabase
      const { error } = await supabase.from("services").insert({
        user_id: user.id,
        name: serviceForm.title,
        description: serviceForm.desc,
        price: parsedPrice,
      });

      if (error) {
        showToast(error.message || "Gagal menambahkan layanan.", "error");
      } else {
        showToast(`Layanan ${serviceForm.title} berhasil ditambahkan!`, "success");
        fetchServices();
      }
    }

    setActiveModal(null);
    setEditingService(null);
  };

  const handleDeleteService = async () => {
    if (deletingServiceId) {
      const { error } = await supabase.from("services").delete().eq("id", deletingServiceId);
      if (error) {
        showToast(error.message || "Gagal menghapus layanan.", "error");
      } else {
        showToast("Layanan berhasil dihapus.", "info");
        fetchServices();
      }
    }
    setActiveModal(null);
    setDeletingServiceId(null);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Services</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage the services you offer to clients.</p>
        </div>
        <Button variant="primary" icon="solar:add-circle-bold" onClick={openAddModal}>
          Add Service
        </Button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl2 p-5 h-36 animate-pulse"></div>
          ))}
        </div>
      )}

      {!loading && services.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl2 p-12 text-center shadow-soft">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Icon icon="solar:box-bold-duotone" className="text-2xl" />
          </div>
          <h3 className="font-semibold text-gray-700 text-sm">Belum Ada Layanan</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            Kamu belum menambahkan paket atau daftar jasa. Klik &quot;Add Service&quot; untuk memulai.
          </p>
          <Button variant="primary" size="sm" className="mt-4" icon="solar:add-circle-bold" onClick={openAddModal}>
            Add Service
          </Button>
        </div>
      )}

      {!loading && services.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv) => (
            <div key={srv.id} className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-5">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                <Icon icon={srv.icon} className="text-brand-600 text-lg" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{srv.name}</h3>
              <p className="text-xs text-gray-400 mb-4 line-clamp-2">{srv.description || "Tanpa deskripsi"}</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  Rp {srv.price.toLocaleString("id-ID")}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEditModal(srv)}
                    title="Edit Service"
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-600 cursor-pointer"
                  >
                    <Icon icon="solar:pen-2-linear" />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingServiceId(srv.id);
                      setActiveModal("modal-delete");
                    }}
                    title="Delete Service"
                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600 cursor-pointer"
                  >
                    <Icon icon="solar:trash-bin-trash-linear" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Service Modal */}
      <Modal
        isOpen={activeModal === "modal-service-form"}
        onClose={() => setActiveModal(null)}
        title={editingService ? "Edit Service" : "Add New Service"}
        maxWidth="sm"
      >
        <div className="space-y-3.5">
          <Input
            label="Service Title *"
            placeholder="e.g. Website Development"
            value={serviceForm.title}
            onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
          />
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>

            <textarea
              rows={3}
              placeholder="Detail singkat pekerjaan atau scope jasa..."
              value={serviceForm.desc}
              onChange={(e) => setServiceForm({ ...serviceForm, desc: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 placeholder:text-gray-300"
            ></textarea>
          </div>
          <Input
            label="Price (Rp) *"
            placeholder="3000000"
            value={serviceForm.price}
            onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
          />
        </div>
        <div className="flex gap-2.5 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => setActiveModal(null)}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSaveService}>
            {editingService ? "Update Service" : "Save Service"}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={activeModal === "modal-delete"}
        onClose={() => setActiveModal(null)}
        title="Delete Service"
        maxWidth="sm"
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
            <Icon icon="solar:danger-triangle-bold" className="text-2xl" />
          </div>
          <p className="text-sm text-gray-600">
            Apakah kamu yakin ingin menghapus layanan ini? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-2.5 mt-5">
            <Button variant="secondary" className="flex-1" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDeleteService}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
