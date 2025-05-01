
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
import { Edit, Trash } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AppointmentModal from "./AppointmentModal";

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

  if (!appointment) return null;

  const displayStatus = getDisplayStatus(appointment.status);
  const statusConfig = appointmentStatusMap[displayStatus];
  const StatusIcon = statusConfig?.icon;
  
  const services = appointment.appointment_services?.map(s => s.services.name) || [];
  
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Detalhes do Agendamento</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Cliente</h3>
              <p>{appointment.clients?.name || "Cliente não especificado"}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Data e Hora</h3>
              <p>{formatDateTime(appointment.start_time, "PPP")}</p>
              <p>{formatDateTime(appointment.start_time, "HH:mm")}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Serviços</h3>
              {services.length > 0 ? (
                <ul className="list-disc list-inside">
                  {services.map((service, index) => (
                    <li key={index}>{service}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Nenhum serviço selecionado</p>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold">Status</h3>
              <div className="flex items-center mt-1">
                <StatusBadge variant={statusConfig?.badgeVariant || "default"} className="flex items-center gap-1">
                  {StatusIcon && <StatusIcon className="h-3 w-3" />}
                  {statusConfig?.label || displayStatus}
                </StatusBadge>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex sm:justify-between justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="sm:order-1 order-3"
            >
              Fechar
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 order-2"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button 
                variant="destructive" 
                className="flex items-center gap-2 order-1"
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
