
import React from "react";
import { Check, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AppointmentActionsProps {
  appointmentId: string;
  currentStatus: string;
  onSuccess?: () => void;
  size?: "default" | "sm" | "xs";
  variant?: "icons" | "full" | "compact";
}

const AppointmentActions = ({
  appointmentId,
  currentStatus,
  onSuccess,
  size = "default",
  variant = "full"
}: AppointmentActionsProps) => {
  const updateAppointmentStatus = async (
    status: string,
    paymentStatus: string,
    paymentMethod?: string
  ) => {
    try {
      const updateData: {
        status: string;
        payment_status: string;
        payment_method?: string;
      } = {
        status: status,
        payment_status: paymentStatus,
      };

      // Only add payment_method if it's provided
      if (paymentMethod) {
        updateData.payment_method = paymentMethod;
      }

      const { error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", appointmentId);

      if (error) throw error;

      toast.success("Status do agendamento atualizado com sucesso");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      toast.error(`Erro ao atualizar: ${error.message || "Tente novamente"}`);
    }
  };

  // Determine if specific actions should be disabled based on current status
  const isCompleted = currentStatus === "finalizado";
  const isCancelled = currentStatus === "cancelado";
  const isPendingPayment = currentStatus === "pagamento pendente";
  
  const getButtonSize = () => {
    switch (size) {
      case "xs": return "h-6 px-2 py-0 text-xs";
      case "sm": return "h-7 px-2 py-1 text-xs";
      default: return "h-8 px-3 py-1 text-sm";
    }
  };
  
  const buttonBaseClass = `rounded-full ${getButtonSize()}`;

  if (variant === "icons") {
    return (
      <div className="flex items-center gap-1">
        <Button
          className={buttonBaseClass}
          variant="outline"
          size="icon"
          onClick={() => updateAppointmentStatus("finalizado", "pago", "dinheiro")}
          disabled={isCompleted}
          title="Finalizar (Pago)"
        >
          <Check className="h-3 w-3 text-green-600" />
        </Button>
        
        <Button
          className={buttonBaseClass}
          variant="outline"
          size="icon"
          onClick={() => updateAppointmentStatus("pagamento pendente", "pendente")}
          disabled={isPendingPayment}
          title="Pagamento Pendente"
        >
          <Clock className="h-3 w-3 text-yellow-600" />
        </Button>
        
        <Button
          className={buttonBaseClass}
          variant="outline"
          size="icon"
          onClick={() => updateAppointmentStatus("cancelado", "não definido")}
          disabled={isCancelled}
          title="Cancelar"
        >
          <XCircle className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1">
        <Button
          className={`${buttonBaseClass} bg-green-50 hover:bg-green-100 text-green-700 border-green-200`}
          variant="outline"
          onClick={() => updateAppointmentStatus("finalizado", "pago", "dinheiro")}
          disabled={isCompleted}
        >
          <Check className="h-3 w-3 mr-1" />
          Pago
        </Button>
        
        <Button
          className={`${buttonBaseClass} bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200`}
          variant="outline"
          onClick={() => updateAppointmentStatus("pagamento pendente", "pendente")}
          disabled={isPendingPayment}
        >
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Button>
        
        <Button
          className={`${buttonBaseClass} bg-red-50 hover:bg-red-100 text-red-700 border-red-200`}
          variant="outline"
          onClick={() => updateAppointmentStatus("cancelado", "não definido")}
          disabled={isCancelled}
        >
          <XCircle className="h-3 w-3 mr-1" />
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Button
        className={`${buttonBaseClass} bg-green-50 hover:bg-green-100 text-green-700 border-green-200`}
        variant="outline"
        onClick={() => updateAppointmentStatus("finalizado", "pago", "dinheiro")}
        disabled={isCompleted}
      >
        <Check className="h-3 w-3 mr-1" />
        Finalizado (Pago)
      </Button>
      
      <Button
        className={`${buttonBaseClass} bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200`}
        variant="outline"
        onClick={() => updateAppointmentStatus("pagamento pendente", "pendente")}
        disabled={isPendingPayment}
      >
        <Clock className="h-3 w-3 mr-1" />
        Pagamento Pendente
      </Button>
      
      <Button
        className={`${buttonBaseClass} bg-red-50 hover:bg-red-100 text-red-700 border-red-200`}
        variant="outline"
        onClick={() => updateAppointmentStatus("cancelado", "não definido")}
        disabled={isCancelled}
      >
        <XCircle className="h-3 w-3 mr-1" />
        Cancelar
      </Button>
    </div>
  );
};

export default AppointmentActions;
