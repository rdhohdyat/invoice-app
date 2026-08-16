"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import { StatusBadge } from "@/app/components/ui";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/clients": "Clients",
  "/clients/detail": "Client Details",
  "/dashboard": "Dashboard",
  "/invoices": "Invoices",
  "/invoices/1": "Invoice Detail",
  "/invoices/create": "Create Invoice",
  "/invoices/edit": "Edit Invoice",
  "/services": "Services",
  "/settings": "Settings",
};

const NAV_MENUS = [
  { label: "Dashboard", href: "/", icon: "solar:widget-5-bold-duotone", desc: "Ringkasan & statistik" },
  { label: "Clients", href: "/clients", icon: "solar:users-group-rounded-bold-duotone", desc: "Kelola data klien" },
  { label: "Services", href: "/services", icon: "solar:box-bold-duotone", desc: "Kelola layanan & harga" },
  { label: "Invoices", href: "/invoices", icon: "solar:bill-list-bold-duotone", desc: "Kelola semua invoice" },
  { label: "Buat Invoice", href: "/invoices/create", icon: "solar:add-circle-bold-duotone", desc: "Buat invoice baru" },
  { label: "Settings", href: "/settings", icon: "solar:settings-bold-duotone", desc: "Pengaturan akun" },
];

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global search states
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    invoices: Array<{ id: string; number: string; clientName: string; total: number; status: string }>;
    clients: Array<{ id: string; name: string; company: string }>;
    services: Array<{ id: string; title: string; price: number }>;
    menus: typeof NAV_MENUS;
  }>({ invoices: [], clients: [], services: [], menus: [] });

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Click outside and key listeners
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Search query fetcher
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ invoices: [], clients: [], services: [], menus: [] });
      setIsSearching(false);
      return;
    }

    // Filter nav menus client-side immediately (no debounce needed)
    const q = searchQuery.trim().toLowerCase();
    const filteredMenus = NAV_MENUS.filter(
      (m) => m.label.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)
    );

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const query = searchQuery.trim();

        const [invRes, cliRes, srvRes] = await Promise.all([
          supabase
            .from("invoices")
            .select("id, number, total, status, clients(name, company)")
            .eq("user_id", user.id)
            .ilike("number", `%${query}%`)
            .limit(5),
          supabase
            .from("clients")
            .select("id, name, company")
            .eq("user_id", user.id)
            .or(`name.ilike.%${query}%,company.ilike.%${query}%`)
            .limit(5),
          supabase
            .from("services")
            .select("id, title, price")
            .eq("user_id", user.id)
            .ilike("title", `%${query}%`)
            .limit(5),
        ]);

        const mappedInvoices = (invRes.data || []).map((inv: any) => ({
          id: inv.id,
          number: inv.number,
          clientName: inv.clients?.name || inv.clients?.company || "Unspecified Client",
          total: Number(inv.total) || 0,
          status: inv.status,
        }));

        setSearchResults({
          invoices: mappedInvoices,
          clients: cliRes.data || [],
          services: srvRes.data || [],
          menus: filteredMenus,
        });
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, supabase]);

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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${pathname === "/" || pathname === "/dashboard"
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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${pathname.startsWith("/clients")
              ? "bg-brand-50 text-brand-600"
              : "text-gray-500 hover:bg-gray-50"
              }`}
          >
            <Icon icon="solar:users-group-rounded-bold-duotone" className="text-lg" /> Clients
          </Link>
          <Link
            href="/services"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${pathname.startsWith("/services")
              ? "bg-brand-50 text-brand-600"
              : "text-gray-500 hover:bg-gray-50"
              }`}
          >
            <Icon icon="solar:box-bold-duotone" className="text-lg" /> Services
          </Link>
          <Link
            href="/invoices"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${pathname.startsWith("/invoices")
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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${pathname.startsWith("/settings")
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

          <div className="hidden md:flex items-center flex-1 max-w-xs relative" ref={searchContainerRef}>
            <div className="relative w-full">
              <Icon
                icon="solar:magnifer-linear"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onFocus={() => setShowResults(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 placeholder:text-gray-300"
              />
            </div>

            {/* Global Search Dropdown */}
            {showResults && searchQuery.trim() !== "" && (
              <div className="absolute top-full left-0 w-80 mt-2 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl max-h-[30rem] overflow-y-auto z-50 p-4 space-y-4">
                {isSearching ? (
                  <div className="flex items-center justify-center py-6 text-gray-400 gap-2">
                    <Icon icon="solar:spinner-bold" className="animate-spin text-lg text-brand-500" />
                    <span className="text-xs font-medium">Mencari...</span>
                  </div>
                ) : (searchResults.invoices.length === 0 &&
                  searchResults.clients.length === 0 &&
                  searchResults.services.length === 0 &&
                  searchResults.menus.length === 0) ? (
                  <div className="text-center py-6 text-gray-400 text-xs font-medium">
                    Tidak ada hasil ditemukan.
                  </div>
                ) : (
                  <>
                    {/* Menus Group */}
                    {searchResults.menus.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          <Icon icon="solar:map-point-bold-duotone" className="text-sm" /> Halaman
                        </div>
                        <div className="space-y-1.5">
                          {searchResults.menus.map((menu) => (
                            <Link
                              key={menu.href}
                              href={menu.href}
                              onClick={() => {
                                setShowResults(false);
                                setSearchQuery("");
                              }}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-brand-50 transition border border-transparent hover:border-brand-100"
                            >
                              <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 shrink-0">
                                <Icon icon={menu.icon} className="text-sm" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-gray-900 truncate">{menu.label}</p>
                                <p className="text-[10px] text-gray-400 truncate">{menu.desc}</p>
                              </div>
                              <Icon icon="solar:arrow-right-linear" className="text-gray-300 text-sm shrink-0" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Invoices Group */}
                    {searchResults.invoices.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          <Icon icon="solar:bill-list-bold-duotone" className="text-sm" /> Invoices
                        </div>
                        <div className="space-y-1.5">
                          {searchResults.invoices.map((inv) => (
                            <Link
                              key={inv.id}
                              href={`/invoices/${inv.id}`}
                              onClick={() => {
                                setShowResults(false);
                                setSearchQuery("");
                              }}
                              className="block p-2 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100"
                            >
                              <div className="flex justify-between items-start">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-gray-900 truncate">{inv.number}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">{inv.clientName}</p>
                                </div>
                                <div className="text-right ml-2 shrink-0">
                                  <p className="text-xs font-semibold text-brand-600">
                                    Rp {inv.total.toLocaleString("id-ID")}
                                  </p>
                                  <div className="inline-block mt-0.5 scale-90 origin-right">
                                    <StatusBadge status={inv.status as any} />
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clients Group */}
                    {searchResults.clients.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          <Icon icon="solar:users-group-rounded-bold-duotone" className="text-sm" /> Clients
                        </div>
                        <div className="space-y-1.5">
                          {searchResults.clients.map((cli) => (
                            <Link
                              key={cli.id}
                              href={`/clients/detail?id=${cli.id}`}
                              onClick={() => {
                                setShowResults(false);
                                setSearchQuery("");
                              }}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100"
                            >
                              <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center text-brand-700 text-xs font-semibold shrink-0">
                                {(cli.name || "C").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-gray-900 truncate">{cli.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{cli.company || "-"}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Services Group */}
                    {searchResults.services.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          <Icon icon="solar:box-bold-duotone" className="text-sm" /> Services
                        </div>
                        <div className="space-y-1.5">
                          {searchResults.services.map((srv) => (
                            <Link
                              key={srv.id}
                              href="/services"
                              onClick={() => {
                                setShowResults(false);
                                setSearchQuery("");
                              }}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100"
                            >
                              <div className="min-w-0 flex-1 mr-2">
                                <p className="text-xs font-semibold text-gray-900 truncate">{srv.title}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-semibold text-gray-900">
                                  Rp {srv.price.toLocaleString("id-ID")}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
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
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full text-left block px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 cursor-pointer"
            >
              Logout
            </button>
          </div>
        )}

        <main className="p-5 md:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
