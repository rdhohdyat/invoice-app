"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button, StatusBadge } from "@/app/components/ui";

export default function UIStatesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">UI States & Component Showcase</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Collection of system state screens (Empty, Loading, Error, Notifications).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Empty State */}
        <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
            <Icon icon="solar:bill-list-bold-duotone" className="text-brand-500 text-3xl" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">No invoices yet</h3>
          <p className="text-sm text-gray-400 max-w-xs mb-5">
            Create your first invoice to start managing your freelance payments.
          </p>
          <Link href="/invoices/create">
            <Button variant="primary" icon="solar:add-circle-bold">
              Create Invoice
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Loading state</h3>
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-100 rounded-lg w-3/4"></div>
            <div className="h-4 bg-gray-100 rounded-lg w-full"></div>
            <div className="h-4 bg-gray-100 rounded-lg w-5/6"></div>
            <div className="h-24 bg-gray-100 rounded-xl w-full mt-4"></div>
          </div>
        </div>

        {/* Error State */}
        <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <Icon icon="solar:danger-triangle-bold-duotone" className="text-red-500 text-3xl" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Something went wrong</h3>
          <p className="text-sm text-gray-400 max-w-xs mb-5">
            We couldn't load your data. Please try again.
          </p>
          <Button variant="secondary">Retry</Button>
        </div>

        {/* Badges & Toast Notification Showcase */}
        <div className="bg-white border border-gray-100 rounded-xl2 shadow-soft p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Toast / Badges</h3>
          <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-4">
            <Icon icon="solar:check-circle-bold" className="text-lg" /> Invoice created successfully
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="draft" />
            <StatusBadge status="sent" />
            <StatusBadge status="unpaid" />
            <StatusBadge status="paid" />
            <StatusBadge status="overdue" />
            <StatusBadge status="cancelled" />
          </div>
        </div>
      </div>
    </div>
  );
}
