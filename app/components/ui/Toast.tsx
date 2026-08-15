"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Icon } from "@iconify/react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = "success") => {
    const id = String(Date.now() + Math.random());
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto remove after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toastIcons: Record<ToastType, { icon: string; bg: string; text: string; border: string }> = {
    success: {
      icon: "solar:check-circle-bold",
      bg: "bg-emerald-500",
      text: "text-white",
      border: "border-emerald-600",
    },
    error: {
      icon: "solar:danger-triangle-bold",
      bg: "bg-red-500",
      text: "text-white",
      border: "border-red-600",
    },
    warning: {
      icon: "solar:bell-bold",
      bg: "bg-amber-500",
      text: "text-white",
      border: "border-amber-600",
    },
    info: {
      icon: "solar:info-circle-bold",
      bg: "bg-blue-500",
      text: "text-white",
      border: "border-blue-600",
    },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const style = toastIcons[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-xl transition-all duration-300 animate-bounce-once ${style.bg} ${style.border} ${style.text}`}
            >
              <div className="flex items-center gap-2.5 text-sm font-medium">
                <Icon icon={style.icon} className="text-xl shrink-0" />
                <span>{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="opacity-80 hover:opacity-100 transition cursor-pointer"
              >
                <Icon icon="solar:close-circle-linear" className="text-lg" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
