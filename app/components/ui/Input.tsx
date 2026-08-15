import React, { InputHTMLAttributes } from "react";
import { Icon } from "@iconify/react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  error,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-gray-500 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <Icon
            icon={icon}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base"
          />
        )}
        <input
          id={inputId}
          className={`w-full ${
            icon ? "pl-10" : "px-3"
          } pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 placeholder:text-gray-300 disabled:bg-gray-50 disabled:text-gray-500 ${
            error ? "border-red-400 focus:ring-red-100" : ""
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};
