import React from "react";

import React, { useState } from "react";
import { Check, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import PaymentServicesModal from "./modal/PaymentServicesModal";

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
  const isMobile = useIsMobile();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
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

      toast({
        title: "Sucesso",
        description: "Status do agendamento atualizado com sucesso",
      });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: `Erro ao atualizar: ${error.message || "Tente novamente"}`,
        variant: "destructive",
      });
    }
  };

  // Handle opening payment modal instead of direct status update
  const handlePaymentClick = () => {
    setIsPaymentModalOpen(true);
  };

  // Determine if specific actions should be disabled based on current status
  const isCompleted = currentStatus === "finalizado";
  const isCancelled = currentStatus === "cancelado";
  const isPendingPayment = currentStatus === "pagamento pendente";
  
  // Ajuste automático do tamanho dos botões com base no tamanho da tela
  const getButtonSize = () => {
    // Em dispositivos móveis, reduzimos ainda mais os tamanhos
    if (isMobile) {
      switch (size) {
        case "xs": return "h-5 px-1 py-0 text-[10px]";
        case "sm": return "h-6 px-1.5 py-0 text-xs";
        default: return "h-7 px-2 py-0.5 text-xs";
      }
    }
    // Tamanhos padrão para desktop
    switch (size) {
      case "xs": return "h-6 px-2 py-0 text-xs";
      case "sm": return "h-7 px-2 py-1 text-xs";
      default: return "h-8 px-3 py-1 text-sm";
    }
  };
  
  const buttonBaseClass = `rounded-full ${getButtonSize()}`;

  // Em dispositivos móveis com a variante "icons", usamos um layout ainda mais compacto
  if (variant === "icons" || (isMobile && variant === "compact")) {
    return (
      <>
        <div className={`flex ${isMobile ? 'items-center justify-center' : 'items-center'} gap-0.5`}>
          <Button
            className={buttonBaseClass}
            variant="outline"
            size="icon"
            onClick={handlePaymentClick}
            disabled={isCompleted}
            title="Finalizar (Pago)"
          >
            <Check className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-green-600`} />
          </Button>
          
          <Button
            className={buttonBaseClass}
            variant="outline"
            size="icon"
            onClick={() => updateAppointmentStatus("pagamento pendente", "pendente")}
            disabled={isPendingPayment}
            title="Pagamento Pendente"
          >
            <Clock className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-yellow-600`} />
          </Button>
          
          <Button
            className={buttonBaseClass}
            variant="outline"
            size="icon"
            onClick={() => updateAppointmentStatus("cancelado", "não definido")}
            disabled={isCancelled}
            title="Cancelar"
          >
            <XCircle className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-red-600`} />
          </Button>
        </div>
        
        <PaymentServicesModal 
          open={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          appointmentId={appointmentId}
          onSuccess={onSuccess || (() => {})}
        />
      </>
    );
  }

  // Para dispositivos móveis com variante "full", usamos a variante "compact"
  if (isMobile && variant === "full") {
    variant = "compact";
  }

  if (variant === "compact") {
    return (
      <>
        <div className={`flex ${isMobile ? 'flex-col items-stretch' : 'items-center'} gap-1`}>
          <Button
            className={`${buttonBaseClass} bg-green-50 hover:bg-green-100 text-green-700 border-green-200`}
            variant="outline"
            onClick={handlePaymentClick}
            disabled={isCompleted}
          >
            <Check className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
            Pago
          </Button>
          
          <Button
            className={`${buttonBaseClass} bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200`}
            variant="outline"
            onClick={() => updateAppointmentStatus("pagamento pendente", "pendente")}
            disabled={isPendingPayment}
          >
            <Clock className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
            Pendente
          </Button>
          
          <Button
            className={`${buttonBaseClass} bg-red-50 hover:bg-red-100 text-red-700 border-red-200`}
            variant="outline"
            onClick={() => updateAppointmentStatus("cancelado", "não definido")}
            disabled={isCancelled}
          >
            <XCircle className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
            Cancelar
          </Button>
        </div>
        
        <PaymentServicesModal 
          open={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          appointmentId={appointmentId}
          onSuccess={onSuccess || (() => {})}
        />
      </>
    );
  }

  return (
    <>
      <div className={`flex ${isMobile ? 'flex-col items-stretch' : 'items-center flex-wrap'} gap-1`}>
        <Button
          className={`${buttonBaseClass} bg-green-50 hover:bg-green-100 text-green-700 border-green-200`}
          variant="outline"
          onClick={handlePaymentClick}
          disabled={isCompleted}
        >
          <Check className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
          {isMobile ? "Pago" : "Finalizado (Pago)"}
        </Button>
        
        <Button
          className={`${buttonBaseClass} bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200`}
          variant="outline"
          onClick={() => updateAppointmentStatus("pagamento pendente", "pendente")}
          disabled={isPendingPayment}
        >
          <Clock className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
          {isMobile ? "Pendente" : "Pagamento Pendente"}
        </Button>
        
        <Button
          className={`${buttonBaseClass} bg-red-50 hover:bg-red-100 text-red-700 border-red-200`}
          variant="outline"
          onClick={() => updateAppointmentStatus("cancelado", "não definido")}
          disabled={isCancelled}
        >
          <XCircle className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
          Cancelar
        </Button>
      </div>
      
      <PaymentServicesModal 
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        appointmentId={appointmentId}
        onSuccess={onSuccess || (() => {})}
      />
    </>
  );
};

export default AppointmentActions;
