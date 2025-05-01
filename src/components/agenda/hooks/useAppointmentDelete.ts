
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

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
      return true;
    } catch (error: any) {
      console.error("Error deleting appointment:", error);
      if (onError) onError(new Error(error.message || "Erro ao excluir agendamento"));
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to delete all recurring appointments in a series
  const deleteAllRecurringAppointments = async (appointment: AppointmentType) => {
    if (!appointment.recurrence || appointment.recurrence === 'none') {
      throw new Error("Este não é um agendamento recorrente");
    }

    setIsDeleting(true);
    
    try {
      // Find a reliable identifier to group related recurring appointments
      // Instead of using created_at which may vary slightly, 
      // we use a combination of client_id, recurrence type, and check for
      // appointments created within a short timeframe (2 minutes)
      
      // First, get creation timestamp of the current appointment
      const { data: currentAppointment } = await supabase
        .from("appointments")
        .select("created_at")
        .eq("id", appointment.id)
        .single();
      
      if (!currentAppointment || !currentAppointment.created_at) {
        throw new Error("Falha ao identificar o agendamento atual");
      }
      
      const creationTime = new Date(currentAppointment.created_at);
      
      // Create a timeframe window to find related appointments 
      // (2 minutes before and after the creation time)
      const twoMinutesMs = 2 * 60 * 1000;
      const timeframeStart = new Date(creationTime.getTime() - twoMinutesMs);
      const timeframeEnd = new Date(creationTime.getTime() + twoMinutesMs);
      
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
      
      // Extract just the IDs
      const appointmentIds = relatedAppointments.map(app => app.id);
      
      // Delete all appointments in a single operation
      const { error: deleteError } = await supabase
        .from("appointments")
        .delete()
        .in("id", appointmentIds);
        
      if (deleteError) throw deleteError;
      
      if (onSuccess) onSuccess();
      return true;
    } catch (error: any) {
      console.error("Error deleting recurring appointments:", error);
      if (onError) onError(new Error(error.message || "Erro ao excluir agendamentos recorrentes"));
      return false;
    } finally {
      // Ensure isDeleting is reset to false even in case of errors
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    deleteSingleAppointment,
    deleteAllRecurringAppointments
  };
};
