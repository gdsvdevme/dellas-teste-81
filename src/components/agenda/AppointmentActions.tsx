
import React, { useState } from "react";
import { Check, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { DialogPaymentServices } from "@/components/payment/DialogPaymentServices";

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
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  const fetchAppointmentDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          client:client_id (
            id,
            name,
            phone
          ),
          appointment_services (
            service_id,
            service:service_id (
              name
            )
          )
        `)
        .eq("id", appointmentId)
        .single();
      
      if (error) throw error;
      console.log("Detalhes do agendamento:", data);
      setSelectedAppointment(data);
      setIsPaymentDialogOpen(true);
    } catch (error: any) {
      console.error("Erro ao buscar detalhes do agendamento:", error);
      toast({
        title: "Erro",
        description: `Erro ao buscar detalhes: ${error.message || "Tente novamente"}`,
        variant: "destructive",
      });
    }
  };

  const updateAppointmentStatus = async (
    status: string,
    paymentStatus: string,
    paymentMethod?: string,
    servicePrices?: Record<string, number>
  ) => {
    try {
      const updateData: {
        status: string;
        payment_status: string;
        payment_method?: string;
        final_price?: number;
      } = {
        status: status,
        payment_status: paymentStatus,
      };

      // Add payment method if provided
      if (paymentMethod) {
        updateData.payment_method = paymentMethod;
      }
      
      // Calculate final price from service prices if provided
      if (servicePrices) {
        const totalPrice = Object.values(servicePrices).reduce(
          (sum, price) => sum + price, 0
        );
        updateData.final_price = totalPrice;
        console.log("Preço total calculado:", totalPrice);
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

  // Handler for payment confirmation from the dialog
  const handlePaymentConfirm = (appointment: any, method: string, servicePrices: Record<string, number>) => {
    console.log("Confirmando pagamento com preços:", servicePrices);
    updateAppointmentStatus("finalizado", "pago", method, servicePrices);
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
            onClick={() => fetchAppointmentDetails()}
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

        {selectedAppointment && (
          <DialogPaymentServices
            open={isPaymentDialogOpen}
            onClose={() => {
              setIsPaymentDialogOpen(false);
              setSelectedAppointment(null);
            }}
            appointment={selectedAppointment}
            onConfirmPayment={handlePaymentConfirm}
          />
        )}
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
            onClick={() => fetchAppointmentDetails()}
            disabled={isCompleted}
          >
            <Check className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
            Pago
          </Button>
          
          <Button
            className={buttonBaseClass}
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

        {selectedAppointment && (
          <DialogPaymentServices
            open={isPaymentDialogOpen}
            onClose={() => {
              setIsPaymentDialogOpen(false);
              setSelectedAppointment(null);
            }}
            appointment={selectedAppointment}
            onConfirmPayment={handlePaymentConfirm}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className={`flex ${isMobile ? 'flex-col items-stretch' : 'items-center flex-wrap'} gap-1`}>
        <Button
          className={`${buttonBaseClass} bg-green-50 hover:bg-green-100 text-green-700 border-green-200`}
          variant="outline"
          onClick={() => fetchAppointmentDetails()}
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

      {selectedAppointment && (
        <DialogPaymentServices
          open={isPaymentDialogOpen}
          onClose={() => {
            setIsPaymentDialogOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onConfirmPayment={handlePaymentConfirm}
        />
      )}
    </>
  );
};

export default AppointmentActions;
