"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button, StatusBadge } from "@/app/components/ui";
import ApexChart from "@/app/components/ApexChart";
import { ApexOptions } from "apexcharts";
import { createClient } from "@/utils/supabase/client";
import { InvoiceStatus } from "@/app/lib/types";

interface RecentInvoice {
  id: string;
  amount: number;
  clientName: string;
  date: string;
  number: string;
  status: InvoiceStatus;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("Freelancer");
  const [stats, setStats] = useState({
    overdueAmount: 0,
    paidAmount: 0,
    totalRevenue: 0,
    unpaidAmount: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [chartSeriesData, setChartSeriesData] = useState<number[]>([0, 0, 0]);
  const [revenueCategories, setRevenueCategories] = useState<string[]>([]);
  const [revenueData, setRevenueData] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = createClient();

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user full name or email
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profile?.full_name) {
      setUserName(profile.full_name.split(" ")[0]);
    } else if (user.email) {
      setUserName(user.email.split("@")[0]);
    }

    // Get all invoices for logged-in user
    const { data: invoices } = await supabase
      .from("invoices")
      .select("*, clients(name, company)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (invoices) {
      let paid = 0;
      let unpaid = 0;
      let overdue = 0;

      invoices.forEach((inv) => {
        const amt = Number(inv.total) || 0;
        if (inv.status === "paid") {
          paid += amt;
        } else if (inv.status === "unpaid" || inv.status === "sent") {
          unpaid += amt;
        } else if (inv.status === "overdue") {
          overdue += amt;
        }
      });

      const totalRev = paid + unpaid + overdue;
      setStats({
        overdueAmount: overdue,
        paidAmount: paid,
        totalRevenue: totalRev,
        unpaidAmount: unpaid,
      });

      // Calculate percentage for Donut Chart
      const paidPct = totalRev > 0 ? Math.round((paid / totalRev) * 100) : 0;
      const unpaidPct = totalRev > 0 ? Math.round((unpaid / totalRev) * 100) : 0;
      const overduePct = totalRev > 0 ? Math.round((overdue / totalRev) * 100) : 0;
      setChartSeriesData([paidPct, unpaidPct, overduePct]);

      // Calculate monthly revenue from database for last 6 months
      const now = new Date();
      const labels: string[] = [];
      const totals: number[] = new Array(6).fill(0);
      const monthKeys: { month: number; year: number }[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleString("en-US", { month: "short" });
        monthKeys.push({ month: d.getMonth(), year: d.getFullYear() });
        labels.push(label);
      }

      invoices.forEach((inv) => {
        const amt = Number(inv.total) || 0;
        const rawDate = inv.date || inv.created_at;
        if (rawDate) {
          const invDate = new Date(rawDate);
          if (!isNaN(invDate.getTime())) {
            const yr = invDate.getFullYear();
            const mo = invDate.getMonth();
            const idx = monthKeys.findIndex((m) => m.year === yr && m.month === mo);
            if (idx !== -1) {
              totals[idx] += amt;
            }
          }
        }
      });

      setRevenueCategories(labels);
      setRevenueData(totals);

      // Recent 5 Invoices
      const mappedRecent: RecentInvoice[] = invoices.slice(0, 5).map((inv) => ({
        id: inv.id,
        amount: Number(inv.total) || 0,
        clientName: inv.clients?.name || inv.clients?.company || "Client",
        date: inv.date,
        number: inv.number,
        status: inv.status as InvoiceStatus,
      }));
      setRecentInvoices(mappedRecent);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Config Bar Chart Revenue Overview
  const revenueChartOptions: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "var(--font-fredoka), system-ui, sans-serif",
    },
    colors: ["#10b981"],
    dataLabels: { enabled: false },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.25,
        gradientToColors: ["#059669"],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.9,
        stops: [0, 100],
      },
    },
    grid: {
      borderColor: "#f1f5f9",
      strokeDashArray: 4,
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        borderRadiusApplication: "end",
        columnWidth: "45%",
      },
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: (val) => `Rp ${val.toLocaleString("id-ID")}`,
      },
    },
    xaxis: {
      categories: revenueCategories.length > 0 ? revenueCategories : ["Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      labels: {
        style: {
          colors: "#94a3b8",
          fontSize: "12px",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val) => val >= 1000000 ? `Rp ${(val / 1000000).toFixed(1)}M` : `Rp ${(val / 1000).toFixed(0)}k`,
        style: {
          colors: "#94a3b8",
          fontSize: "11px",
        },
      },
    },
  };

  const revenueChartSeries = [
    {
      data: revenueData,
      name: "Revenue",
    },
  ];

  // Config Donut Chart Payment Status
  const paymentStatusChartOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "var(--font-fredoka), system-ui, sans-serif",
    },
    colors: ["#10b981", "#f59e0b", "#ef4444"],
    dataLabels: { enabled: false },
    labels: ["Paid", "Unpaid", "Overdue"],
    legend: {
      position: "bottom",
      fontSize: "12px",
      labels: { colors: "#64748b" },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Revenue",
              color: "#94a3b8",
              fontSize: "11px",
              formatter: () => `Rp ${(stats.totalRevenue / 1000000).toFixed(1)}M`,
            },
          },
        },
      },
    },
    stroke: { width: 2, colors: ["#ffffff"] },
    tooltip: {
      y: {
        formatter: (val) => `${val}%`,
      },
    },
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Good day, {userName} 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5">Here&apos;s what&apos;s happening with your business.</p>
        </div>
        <Link href="/invoices/create">
          <Button variant="primary" icon="solar:add-circle-bold">
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-400">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <Icon icon="solar:wallet-money-bold-duotone" className="text-brand-600" />
            </div>
          </div>
          <p className="text-xl font-semibold text-gray-900">
            {loading ? "..." : `Rp ${stats.totalRevenue.toLocaleString("id-ID")}`}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-400">Paid</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon icon="solar:check-circle-bold-duotone" className="text-emerald-600" />
            </div>
          </div>
          <p className="text-xl font-semibold text-gray-900">
            {loading ? "..." : `Rp ${stats.paidAmount.toLocaleString("id-ID")}`}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-400">Unpaid</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Icon icon="solar:clock-circle-bold-duotone" className="text-amber-600" />
            </div>
          </div>
          <p className="text-xl font-semibold text-gray-900">
            {loading ? "..." : `Rp ${stats.unpaidAmount.toLocaleString("id-ID")}`}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-400">Overdue</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Icon icon="solar:danger-triangle-bold-duotone" className="text-red-600" />
            </div>
          </div>
          <p className="text-xl font-semibold text-gray-900">
            {loading ? "..." : `Rp ${stats.overdueAmount.toLocaleString("id-ID")}`}
          </p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl2 shadow-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Revenue Overview</h3>
              <p className="text-xs text-gray-400">Monthly breakdown of your earnings</p>
            </div>
          </div>
          <ApexChart
            options={revenueChartOptions}
            series={revenueChartSeries}
            type="bar"
            height={260}
          />
        </div>

        <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Payment Status</h3>
              <p className="text-xs text-gray-400">Distribution of invoice statuses</p>
            </div>
          </div>
          <ApexChart
            options={paymentStatusChartOptions}
            series={chartSeriesData.every((v) => v === 0) ? [100, 0, 0] : chartSeriesData}
            type="donut"
            height={260}
          />
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Recent Invoices</h3>
          <Link
            href="/invoices"
            className="text-xs font-medium text-brand-600 hover:text-brand-700 cursor-pointer"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">Memuat recent invoices...</div>
        ) : recentInvoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">Belum ada invoice.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                  <th className="font-medium px-5 py-3">Invoice</th>
                  <th className="font-medium px-5 py-3">Client</th>
                  <th className="font-medium px-5 py-3">Date</th>
                  <th className="font-medium px-5 py-3">Amount</th>
                  <th className="font-medium px-5 py-3">Status</th>
                  <th className="font-medium px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-5 py-3.5 font-medium text-gray-800">{inv.number}</td>
                    <td className="px-5 py-3.5 text-gray-600">{inv.clientName}</td>
                    <td className="px-5 py-3.5 text-gray-500">{inv.date}</td>
                    <td className="px-5 py-3.5 text-gray-800 font-medium">
                      Rp {inv.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-gray-400 hover:text-brand-600 cursor-pointer p-1"
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
  );
}
