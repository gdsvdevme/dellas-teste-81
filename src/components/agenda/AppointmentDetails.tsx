
import { useState } from "react";
import { formatDateTime, appointmentStatusMap, getDisplayStatus } from "./AgendaUtils";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Edit, Trash, Check, X, ChevronDown } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AppointmentModal from "./AppointmentModal";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type AppointmentDetailsType = {
  id: string;
  start_time: string;
  client_name: string;
  services: string[];
  status: string;
};

type AppointmentWithRelations = Database["public"]["Tables"]["appointments"]["Row"] & {
  clients: { name: string } | null;
  appointment_services: Array<{
    service_id: string;
    services: { name: string; duration: number };
    final_price: number;
  }> | null;
};

interface AppointmentDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentWithRelations | null;
  onSuccess?: () => void;
}

const AppointmentDetails = ({ 
  open, 
  onOpenChange, 
  appointment, 
  onSuccess 
}: AppointmentDetailsProps) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Estado para controlar os valores de serviços
  const [serviceValues, setServiceValues] = useState<Record<string, number>>({});

  if (!appointment) return null;

  const displayStatus = getDisplayStatus(appointment.status);
  const statusConfig = appointmentStatusMap[displayStatus];
  const StatusIcon = statusConfig?.icon;
  
  const services = appointment.appointment_services?.map(s => ({
    id: s.service_id,
    name: s.services.name,
    price: s.final_price
  })) || [];
  
  // Inicializar os valores de serviço a partir do appointment
  if (Object.keys(serviceValues).length === 0 && services.length > 0) {
    const initialValues: Record<string, number> = {};
    services.forEach(service => {
      initialValues[service.id] = service.price;
    });
    setServiceValues(initialValues);
  }
  
  // Calcular o valor total dos serviços
  const calculateTotal = () => {
    return Object.values(serviceValues).reduce((sum, price) => sum + price, 0);
  };
  
  const handleUpdateStatus = async (newStatus: string, newPaymentStatus: string) => {
    setIsUpdating(true);
    try {
      // Atualizar o status do agendamento
      const { error } = await supabase
        .from("appointments")
        .update({
          status: newStatus,
          payment_status: newPaymentStatus === "não definido" ? null : newPaymentStatus,
          // Atualizar também o preço final quando o status for atualizado
          final_price: calculateTotal()
        })
        .eq("id", appointment.id);

      if (error) throw error;

      // Atualizar os preços dos serviços
      if (Object.keys(serviceValues).length > 0) {
        for (const serviceId of Object.keys(serviceValues)) {
          const { error: serviceError } = await supabase
            .from("appointment_services")
            .update({ final_price: serviceValues[serviceId] })
            .eq("appointment_id", appointment.id)
            .eq("service_id", serviceId);
            
          if (serviceError) throw serviceError;
        }
      }

      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso",
      });
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Falha ao atualizar status: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointment.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso",
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Falha ao excluir agendamento: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open && !showEditModal} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-0 rounded-lg overflow-y-auto max-h-[85vh]">
          <DialogHeader className="bg-gradient-to-r from-salon-primary/90 to-salon-primary p-4 sm:p-5 rounded-t-lg sticky top-0 z-[55]">
            <DialogTitle className="text-white flex items-center gap-2">
              <span>Detalhes do Agendamento</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 p-4 sm:p-5">
            {/* Seção Cliente */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-xs uppercase font-semibold text-muted-foreground mb-1">CLIENTE</h3>
                <p className="text-lg font-medium">{appointment.clients?.name || "Cliente não especificado"}</p>
              </CardContent>
            </Card>
            
            {/* Seção Data e Hora */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-xs uppercase font-semibold text-muted-foreground mb-1">DATA E HORA</h3>
                <p className="font-medium">{formatDateTime(appointment.start_time, "PPP")}</p>
                <p>{formatDateTime(appointment.start_time, "HH:mm")}</p>
              </CardContent>
            </Card>
            
            {/* Seção Serviços */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-xs uppercase font-semibold text-muted-foreground mb-1">SERVIÇOS</h3>
                {services.length > 0 ? (
                  <div className="space-y-3 mt-2">
                    {services.map((service, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium flex-1">{service.name}</span>
                        <div className="flex items-center gap-1 w-24">
                          <span className="text-sm font-medium text-muted-foreground">R$</span>
                          <Input 
                            type="number" 
                            className="w-full text-right h-8 text-sm"
                            value={serviceValues[service.id] || service.price}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              setServiceValues({...serviceValues, [service.id]: newValue});
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 mt-2 border-t flex justify-between font-semibold">
                      <span>Total</span>
                      <span>R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Nenhum serviço selecionado</p>
                )}
              </CardContent>
            </Card>
            
            {/* Seção Status */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-xs uppercase font-semibold text-muted-foreground mb-1">STATUS</h3>
                <div className="flex items-center mt-1">
                  <StatusBadge 
                    variant={statusConfig?.badgeVariant || "default"} 
                    className="flex items-center gap-1 py-1 px-3 text-sm"
                  >
                    {StatusIcon && <StatusIcon className="h-3.5 w-3.5" />}
                    {statusConfig?.label || displayStatus}
                  </StatusBadge>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 flex-col sm:flex-row gap-3">
            <div className="flex gap-2 w-full sm:w-auto order-3 sm:order-1">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Fechar
              </Button>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-2">
              <Button 
                variant="destructive" 
                className="flex items-center gap-1 w-full sm:w-auto"
                onClick={() => handleUpdateStatus("cancelado", "não definido")}
                disabled={isUpdating}
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="default"
                    className="flex items-center justify-between gap-2 w-full sm:w-auto"
                    disabled={isUpdating}
                  >
                    <span className="flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Concluir
                    </span>
                    <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 z-[85] bg-popover">
                  <DropdownMenuItem 
                    className="cursor-pointer flex items-center gap-2" 
                    onClick={() => handleUpdateStatus("finalizado", "pago")}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Pago</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer flex items-center gap-2" 
                    onClick={() => handleUpdateStatus("pagamento pendente", "pendente")}
                  >
                    <ChevronDown className="h-4 w-4 text-yellow-600" />
                    <span>Não pago</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-1 w-full sm:w-auto"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              
              <Button 
                variant="outline"
                className="flex items-center gap-1 text-destructive w-full sm:w-auto"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash className="h-4 w-4" />
                {isDeleting ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {appointment && (
        <AppointmentModal
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open);
            if (!open && !onOpenChange) {
              onOpenChange(true); // Reopen details modal when edit modal closes
            }
          }}
          appointment={appointment}
          onSuccess={() => {
            if (onSuccess) onSuccess();
            setShowEditModal(false);
            onOpenChange(false);
          }}
        />
      )}
    </>
  );
};

export default AppointmentDetails;
