import React, { ButtonHTMLAttributes } from "react";
import { Icon } from "@iconify/react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
  icon?: string;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  isLoading,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: "bg-brand-600 text-white shadow-soft hover:bg-brand-700",
    secondary: "border border-gray-200 text-gray-600 hover:bg-gray-50",
    danger: "bg-red-500 text-white shadow-soft hover:bg-red-600",
    ghost: "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
    dark: "bg-gray-900 text-white hover:bg-gray-800",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-5 py-3 text-base gap-2.5",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Icon icon="solar:spinner-linear" className="animate-spin text-lg" />
      ) : (
        icon && <Icon icon={icon} className="text-lg" />
      )}
      {children}
    </button>
  );
};
