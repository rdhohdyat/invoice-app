"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/clients": "Clients",
  "/clients/detail": "Client Details",
  "/services": "Services",
  "/invoices": "Invoices",
  "/invoices/create": "Create Invoice",
  "/invoices/edit": "Edit Invoice",
  "/invoices/1": "Invoice Detail",
  "/settings": "Settings",
};

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // If on login or register, render children without sidebar/header layout
  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  const currentTitle = pageTitles[pathname] || "Dashboard";

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 text-gray-800 antialiased">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-white border-r border-gray-100 min-h-screen py-5 px-4 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
            <Icon icon="solar:bill-list-bold" className="text-white text-lg" />
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-sm text-gray-900">Freelancer</p>
            <p className="text-[11px] text-gray-400 -mt-0.5">Invoice Manager</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <p className="px-3 text-[10px] font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Main</p>
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              pathname === "/" || pathname === "/dashboard"
                ? "bg-brand-50 text-brand-600"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Icon icon="solar:widget-5-bold-duotone" className="text-lg" /> Dashboard
          </Link>

          <p className="px-3 text-[10px] font-semibold text-gray-300 uppercase tracking-wider mb-1.5 mt-4">
            Manage
          </p>
          <Link
            href="/clients"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              pathname.startsWith("/clients")
                ? "bg-brand-50 text-brand-600"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Icon icon="solar:users-group-rounded-bold-duotone" className="text-lg" /> Clients
          </Link>
          <Link
            href="/services"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              pathname.startsWith("/services")
                ? "bg-brand-50 text-brand-600"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Icon icon="solar:box-bold-duotone" className="text-lg" /> Services
          </Link>
          <Link
            href="/invoices"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              pathname.startsWith("/invoices")
                ? "bg-brand-50 text-brand-600"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Icon icon="solar:bill-list-bold-duotone" className="text-lg" /> Invoices
          </Link>

          <p className="px-3 text-[10px] font-semibold text-gray-300 uppercase tracking-wider mb-1.5 mt-4">
            Account
          </p>
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              pathname.startsWith("/settings")
                ? "bg-brand-50 text-brand-600"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Icon icon="solar:settings-bold-duotone" className="text-lg" /> Settings
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition w-full text-left cursor-pointer"
        >
          <Icon icon="solar:logout-3-bold-duotone" className="text-lg" /> Logout
        </button>
      </aside>

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-gray-50/90 backdrop-blur border-b border-gray-100 px-5 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center"
            >
              <Icon icon="solar:hamburger-menu-linear" className="text-lg text-gray-500" />
            </button>
            <h2 className="font-semibold text-gray-900 text-base md:text-lg">{currentTitle}</h2>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-xs">
            <div className="relative w-full">
              <Icon
                icon="solar:magnifer-linear"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50">
              <Icon icon="solar:bell-bold-duotone" className="text-lg text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
            <Link
              href="/settings"
              className="flex items-center gap-2 pl-3 border-l border-gray-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold">
                R
              </div>
              <div className="hidden md:block leading-tight">
                <p className="text-sm font-medium text-gray-800">Ridho</p>
                <p className="text-[11px] text-gray-400 -mt-0.5">Freelancer</p>
              </div>
              <Icon icon="solar:alt-arrow-down-linear" className="hidden md:block text-gray-400 text-sm" />
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-5 py-4 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Dashboard
            </Link>
            <Link
              href="/clients"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clients
            </Link>
            <Link
              href="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Services
            </Link>
            <Link
              href="/invoices"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Invoices
            </Link>
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Settings
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50"
            >
              Logout
            </Link>
          </div>
        )}

        <main className="p-5 md:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
