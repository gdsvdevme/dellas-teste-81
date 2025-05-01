
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type AppointmentType = Database["public"]["Tables"]["appointments"]["Row"] & {
  clients?: { name: string } | null;
  appointment_services?: Array<{
    service_id: string;
    services: { name: string; duration: number };
    final_price: number;
  }> | null;
};

interface UseAppointmentDeleteProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useAppointmentDelete = ({
  onSuccess,
  onError
}: UseAppointmentDeleteProps = {}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Function to delete a single appointment by ID
  const deleteSingleAppointment = async (appointmentId: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) throw error;
      
      if (onSuccess) onSuccess();
      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso",
      });
      return true;
    } catch (error: any) {
      console.error("Error deleting appointment:", error);
      if (onError) onError(new Error(error.message || "Erro ao excluir agendamento"));
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir agendamento",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
      setProgress(0);
    }
  };

  // Function to delete all recurring appointments in a series
  const deleteAllRecurringAppointments = async (appointment: AppointmentType) => {
    if (!appointment.recurrence || appointment.recurrence === 'none') {
      throw new Error("Este não é um agendamento recorrente");
    }

    setIsDeleting(true);
    setProgress(10); // Indicador inicial de progresso
    
    try {
      // First, check if this appointment has a recurrence_group_id
      if (!appointment.recurrence_group_id) {
        setProgress(20);
        // If not, use the old method as a fallback for backward compatibility
        return await deleteRecurringAppointmentsLegacy(appointment);
      }
      
      setProgress(30);
      // Get all appointments in the same recurrence group
      const { data: relatedAppointments, error: fetchError } = await supabase
        .from("appointments")
        .select("id")
        .eq("recurrence_group_id", appointment.recurrence_group_id);

      if (fetchError) throw fetchError;
      
      if (!relatedAppointments || relatedAppointments.length === 0) {
        throw new Error("Não foram encontrados agendamentos relacionados");
      }
      
      setProgress(60);
      // Extract just the IDs
      const appointmentIds = relatedAppointments.map(app => app.id);
      
      // Delete all appointments in a single operation
      const { error: deleteError } = await supabase
        .from("appointments")
        .delete()
        .in("id", appointmentIds);
        
      if (deleteError) throw deleteError;
      
      setProgress(90);
      if (onSuccess) onSuccess();
      
      toast({
        title: "Sucesso",
        description: `${appointmentIds.length} agendamentos recorrentes excluídos com sucesso`,
      });
      
      setProgress(100);
      return true;
    } catch (error: any) {
      console.error("Error deleting recurring appointments:", error);
      if (onError) onError(new Error(error.message || "Erro ao excluir agendamentos recorrentes"));
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir agendamentos recorrentes",
        variant: "destructive",
      });
      return false;
    } finally {
      // Ensure isDeleting is reset to false even in case of errors
      setIsDeleting(false);
      setProgress(0);
    }
  };

  // Legacy method for backward compatibility with old appointments
  const deleteRecurringAppointmentsLegacy = async (appointment: AppointmentType) => {
    try {
      setProgress(25);
      // First, get creation timestamp of the current appointment
      const { data: currentAppointment } = await supabase
        .from("appointments")
        .select("created_at")
        .eq("id", appointment.id)
        .single();
      
      if (!currentAppointment || !currentAppointment.created_at) {
        throw new Error("Falha ao identificar o agendamento atual");
      }
      
      setProgress(40);
      const creationTime = new Date(currentAppointment.created_at);
      
      // Create a timeframe window to find related appointments 
      // (2 minutes before and after the creation time)
      const twoMinutesMs = 2 * 60 * 1000;
      const timeframeStart = new Date(creationTime.getTime() - twoMinutesMs);
      const timeframeEnd = new Date(creationTime.getTime() + twoMinutesMs);
      
      setProgress(50);
      // Get all appointments that match our criteria for being in the same recurrence series
      const { data: relatedAppointments, error: fetchError } = await supabase
        .from("appointments")
        .select("id")
        .eq("client_id", appointment.client_id)
        .eq("recurrence", appointment.recurrence)
        .gte("created_at", timeframeStart.toISOString())
        .lte("created_at", timeframeEnd.toISOString());

      if (fetchError) throw fetchError;
      
      if (!relatedAppointments || relatedAppointments.length === 0) {
        throw new Error("Não foram encontrados agendamentos relacionados");
      }
      
      setProgress(70);
      // Extract just the IDs
      const appointmentIds = relatedAppointments.map(app => app.id);
      
      // Delete all appointments in a single operation
      const { error: deleteError } = await supabase
        .from("appointments")
        .delete()
        .in("id", appointmentIds);
        
      if (deleteError) throw deleteError;
      
      setProgress(90);
      if (onSuccess) onSuccess();
      
      toast({
        title: "Sucesso",
        description: `${appointmentIds.length} agendamentos recorrentes excluídos com sucesso`,
      });
      
      return true;
    } catch (error: any) {
      console.error("Error in legacy deletion method:", error);
      throw error; // Re-throw to be handled by the calling function
    }
  };

  return {
    isDeleting,
    progress,
    deleteSingleAppointment,
    deleteAllRecurringAppointments
  };
};
