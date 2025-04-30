
import { cn } from "@/lib/utils";

type StatusVariant = "default" | "success" | "warning" | "danger" | "info";

interface StatusBadgeProps {
  variant?: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

const statusStyles = {
  default: "bg-gray-100 text-gray-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
};

export function StatusBadge({
  variant = "default",
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
