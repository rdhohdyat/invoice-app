import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else if (shouldRender) {
      // Delay unmounting to let the exit animation complete (200ms matches animate-fade-out/animate-modal-out)
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4 ${
        isOpen ? "animate-fade-in" : "animate-fade-out"
      }`}
    >
      <div
        className={`bg-white rounded-xl2 shadow-card w-full ${
          maxWidthClasses[maxWidth]
        } p-6 ${isOpen ? "animate-modal-in" : "animate-modal-out"}`}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <Icon icon="solar:close-circle-linear" className="text-xl" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
