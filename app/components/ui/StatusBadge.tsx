import React from "react";
import { Icon } from "@iconify/react";

export type StatusVariant = "paid" | "unpaid" | "overdue" | "draft" | "sent" | "cancelled";

export interface StatusBadgeProps {
  status: StatusVariant | string;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  paid: { bg: "bg-emerald-50", text: "text-emerald-600", label: "PAID" },
  unpaid: { bg: "bg-amber-50", text: "text-amber-600", label: "UNPAID" },
  overdue: { bg: "bg-red-50", text: "text-red-500", label: "OVERDUE" },
  draft: { bg: "bg-gray-100", text: "text-gray-500", label: "DRAFT" },
  sent: { bg: "bg-blue-50", text: "text-blue-600", label: "SENT" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-400", label: "CANCELLED" },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const key = status.toLowerCase();
  const style = statusStyles[key] || {
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: status.toUpperCase(),
  };

  return (
    <span className={`status-badge ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};
