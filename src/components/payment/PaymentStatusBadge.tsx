
import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentStatusBadgeProps {
  status: 'pending' | 'paid' | 'processing' | 'error';
  className?: string;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'paid':
        return {
          label: 'Pago',
          icon: CheckCircle,
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'processing':
        return {
          label: 'Processando',
          icon: Loader2,
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'error':
        return {
          label: 'Erro',
          icon: AlertCircle,
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      default:
        return {
          label: 'Pendente',
          icon: Clock,
          variant: 'outline' as const,
          className: 'bg-yellow-50 text-yellow-800 border-yellow-200'
        };
    }
  };

  const { label, icon: Icon, className: statusClassName } = getStatusConfig();

  return (
    <Badge className={cn(statusClassName, className)}>
      <Icon className={cn("h-3 w-3 mr-1", status === 'processing' && "animate-spin")} />
      {label}
    </Badge>
  );
};

export default PaymentStatusBadge;
