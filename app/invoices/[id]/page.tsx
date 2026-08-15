"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button, StatusBadge, useToast } from "@/app/components/ui";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDFDocument, InvoicePDFData } from "@/app/components/InvoicePDFDocument";
import { createClient } from "@/utils/supabase/client";
import { InvoiceStatus } from "@/app/lib/types";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.id;

  const [invoiceData, setInvoiceData] = useState<InvoicePDFData | null>(null);
  const [currentStatus, setCurrentStatus] = useState<InvoiceStatus>("draft");
  const [loading, setLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState(false);

  const { showToast } = useToast();
  const supabase = createClient();

  const fetchInvoiceDetail = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch user profile info
    let profileInfo = {
      companyName: "FREELANCER STUDIO",
      companySubtitle: "Web Development & Digital Services",
      companyEmail: user?.email || "hello@example.com",
      companyPhone: "+62 812 0000 0000",
      bankName: "Bank BCA",
      accountNumber: "1234567890",
      accountHolder: "Freelancer Owner",
    };

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        profileInfo = {
          companyName: profile.company_name || profile.full_name || "FREELANCER STUDIO",
          companySubtitle: "Web Development & Digital Services",
          companyEmail: profile.email || user.email || "",
          companyPhone: profile.phone || "+62 812 0000 0000",
          bankName: profile.bank_name || "Bank BCA",
          accountNumber: profile.account_number || "1234567890",
          accountHolder: profile.account_holder || profile.full_name || "Freelancer Owner",
        };
      }
    }

    // Fetch invoice + clients + invoice_items
    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .select("*, clients(*), invoice_items(*)")
      .eq("id", invoiceId)
      .single();

    if (invErr || !inv) {
      // Fallback dummy for direct demo view if ID not found
      setInvoiceData({
        number: "INV-2026-001",
        status: "paid",
        date: "Aug 15, 2026",
        dueDate: "Aug 30, 2026",
        ...profileInfo,
        clientName: "PT ABC Indonesia",
        clientEmail: "john@example.com",
        clientAddress: "Jakarta, Indonesia",
        items: [
          { description: "Website Development", quantity: 1, price: 3000000 },
          { description: "Hosting", quantity: 1, price: 500000 },
        ],
        subtotal: 3500000,
        discount: 200000,
        tax: 330000,
        total: 3630000,
        notes: "Thank you for your business.",
      });
      setCurrentStatus("paid");
    } else {
      setCurrentStatus(inv.status as InvoiceStatus);
      const itemsMapped = (inv.invoice_items || []).map((it: { description: string; quantity: number; price: number }) => ({
        description: it.description,
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0,
      }));

      setInvoiceData({
        number: inv.number,
        status: inv.status,
        date: inv.date,
        dueDate: inv.due_date,
        ...profileInfo,
        bankName: inv.bank_name || profileInfo.bankName,
        accountNumber: inv.account_number || profileInfo.accountNumber,
        accountHolder: inv.account_holder || profileInfo.accountHolder,
        clientName: inv.clients?.name || "Unspecified Client",
        clientEmail: inv.clients?.email || "-",
        clientAddress: inv.clients?.address || "-",
        items: itemsMapped,
        subtotal: Number(inv.subtotal) || 0,
        discount: Number(inv.discount) || 0,
        tax: Number(inv.tax) || 0,
        total: Number(inv.total) || 0,
        notes: inv.notes || "Thank you for your business.",
      });
    }
    setLoading(false);
  }, [invoiceId, supabase]);

  useEffect(() => {
    fetchInvoiceDetail();
  }, [fetchInvoiceDetail]);

  const handleMarkAsPaid = async () => {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", invoiceId);

    if (error) {
      showToast(error.message || "Gagal memperbarui status invoice.", "error");
    } else {
      showToast("Invoice berhasil ditandai sebagai PAID!", "success");
      setCurrentStatus("paid");
      if (invoiceData) {
        setInvoiceData({ ...invoiceData, status: "paid" });
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceData) return;
    setIsExporting(true);
    showToast("Meng-generate dokumen PDF resmi...", "info");

    try {
      const blob = await pdf(<InvoicePDFDocument data={invoiceData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${invoiceData.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("Dokumen PDF berhasil diunduh!", "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal membuat dokumen PDF.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-400 mt-2">Memuat detail invoice dari Supabase...</p>
      </div>
    );
  }

  if (!invoiceData) return null;

  return (
    <div>
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
        <div>
          <Link
            href="/invoices"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-1.5 cursor-pointer"
          >
            <Icon icon="solar:arrow-left-linear" /> Back to Invoices
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Invoice {invoiceData.number}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/invoices/edit">
            <Button variant="secondary" size="sm" icon="solar:pen-2-linear">
              Edit
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            icon="solar:download-linear"
            isLoading={isExporting}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
          <Button variant="secondary" size="sm" icon="solar:printer-linear" onClick={handlePrint}>
            Print
          </Button>
          {currentStatus !== "paid" && (
            <Button variant="primary" size="sm" icon="solar:check-circle-bold" onClick={handleMarkAsPaid}>
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      {/* On-screen Preview Card */}
      <div className="bg-white border border-gray-100 rounded-xl2 shadow-card p-6 sm:p-10 max-w-3xl mx-auto print:shadow-none print:border-none print:p-0">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <Icon icon="solar:bill-list-bold" className="text-white text-sm" />
              </div>
              <span className="font-semibold text-gray-900">{invoiceData.companyName}</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {invoiceData.companySubtitle}
              <br />
              {invoiceData.companyEmail}
              <br />
              {invoiceData.companyPhone}
            </p>
          </div>
          <div className="sm:text-right">
            <h2 className="text-2xl font-semibold text-gray-900 tracking-wide">INVOICE</h2>
            <p className="text-sm text-gray-400">{invoiceData.number}</p>
            <div className="mt-2 inline-flex">
              <StatusBadge status={currentStatus} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 pb-8 border-b border-gray-100">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Bill To</p>
            <p className="text-sm font-medium text-gray-800">{invoiceData.clientName}</p>
            <p className="text-xs text-gray-400">{invoiceData.clientEmail}</p>
            <p className="text-xs text-gray-400">{invoiceData.clientAddress}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Invoice Date</p>
            <p className="text-sm text-gray-700">{invoiceData.date}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Due Date</p>
            <p className="text-sm text-gray-700">{invoiceData.dueDate}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
              <th className="font-medium py-2.5">Description</th>
              <th className="font-medium py-2.5 text-center">Qty</th>
              <th className="font-medium py-2.5 text-right">Price</th>
              <th className="font-medium py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoiceData.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 text-gray-700">{item.description}</td>
                <td className="py-3 text-center text-gray-500">{item.quantity}</td>
                <td className="py-3 text-right text-gray-500">Rp {item.price.toLocaleString("id-ID")}</td>
                <td className="py-3 text-right text-gray-700 font-medium">
                  Rp {(item.quantity * item.price).toLocaleString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-full sm:w-64 space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span className="text-gray-600">Rp {invoiceData.subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Discount</span>
              <span className="text-gray-600">Rp {invoiceData.discount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Tax</span>
              <span className="text-gray-600">Rp {invoiceData.tax.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 text-base">
              <span className="font-semibold text-gray-900">TOTAL</span>
              <span className="font-semibold text-brand-600">
                Rp {invoiceData.total.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-dashed border-gray-200">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Payment Information
            </p>
            <p className="text-sm text-gray-700">{invoiceData.bankName}</p>
            <p className="text-sm text-gray-700">{invoiceData.accountNumber}</p>
            <p className="text-sm text-gray-700">{invoiceData.accountHolder}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Notes</p>
            <p className="text-sm text-gray-500">{invoiceData.notes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
