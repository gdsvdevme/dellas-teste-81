
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type AppointmentType = Database["public"]["Tables"]["appointments"]["Row"] & {
  clients?: { name: string; phone?: string } | null;
  appointment_services?: Array<{
    service_id: string;
    services: { name: string; duration: number };
    final_price: number;
  }> | null;
  is_parent?: boolean;
  parent_appointment_id?: string | null;
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
    setProgress(10);
    
    try {
      // First check if this is a parent appointment
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .select("parent_appointment_id, is_parent")
        .eq("id", appointmentId)
        .single();
      
      if (appointmentError) throw appointmentError;
      
      setProgress(25);
      
      // If it's a parent appointment, we need to handle child appointments
      if (appointmentData.is_parent) {
        // Get the first child appointment (to potentially make it the new parent)
        const { data: childAppointments, error: childError } = await supabase
          .from("appointments")
          .select("id")
          .eq("parent_appointment_id", appointmentId)
          .order("start_time", { ascending: true })
          .limit(2); // We only need the first child and to check if there are more
        
        if (childError) throw childError;
        
        setProgress(40);
        
        if (childAppointments && childAppointments.length > 0) {
          // There's at least one child, so update this first child to be the new parent
          const firstChildId = childAppointments[0].id;
          
          // Make the first child the new parent
          const { error: updateError } = await supabase
            .from("appointments")
            .update({ 
              is_parent: true,
              parent_appointment_id: null
            })
            .eq("id", firstChildId);
            
          if (updateError) throw updateError;
          
          setProgress(60);
          
          // Update all other children to point to the new parent
          if (childAppointments.length > 1) {
            const { error: updateChildrenError } = await supabase
              .from("appointments")
              .update({ parent_appointment_id: firstChildId })
              .eq("parent_appointment_id", appointmentId)
              .neq("id", firstChildId);
              
            if (updateChildrenError) throw updateChildrenError;
          }
          
          setProgress(80);
        }
      }
      
      // Finally, delete the appointment
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) throw error;
      
      setProgress(100);
      
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

  // Function to delete future appointments in a recurring series
  const deleteFutureRecurringAppointments = async (appointment: AppointmentType) => {
    setIsDeleting(true);
    setProgress(10);
    
    try {
      let parentId = appointment.id;
      const currentDate = new Date();
      
      // If this is a child appointment, get the parent ID
      if (appointment.parent_appointment_id) {
        parentId = appointment.parent_appointment_id;
      }
      
      setProgress(30);
      
      // Get all future appointments in the same series (including current if it's in the future)
      const { data: futureAppointments, error: fetchError } = await supabase
        .from("appointments")
        .select("id, start_time, status, payment_status")
        .or(`id.eq.${parentId},parent_appointment_id.eq.${parentId}`)
        .gte("start_time", currentDate.toISOString());

      if (fetchError) throw fetchError;
      
      if (!futureAppointments || futureAppointments.length === 0) {
        throw new Error("Não foram encontrados agendamentos futuros para excluir");
      }
      
      setProgress(50);
      
      // Filter out completed/paid appointments for safety
      const appointmentsToDelete = futureAppointments.filter(apt => 
        apt.status !== "finalizado" && apt.payment_status !== "pago"
      );
      
      if (appointmentsToDelete.length === 0) {
        toast({
          title: "Informação",
          description: "Não há agendamentos futuros pendentes para excluir",
        });
        return true;
      }
      
      setProgress(70);
      
      // Extract just the IDs
      const appointmentIds = appointmentsToDelete.map(app => app.id);
      
      // Delete future appointments in a single operation
      const { error: deleteError } = await supabase
        .from("appointments")
        .delete()
        .in("id", appointmentIds);
        
      if (deleteError) throw deleteError;
      
      setProgress(90);
      
      if (onSuccess) onSuccess();
      
      toast({
        title: "Sucesso",
        description: `${appointmentIds.length} agendamentos futuros excluídos com sucesso`,
      });
      
      setProgress(100);
      return true;
    } catch (error: any) {
      console.error("Error deleting future recurring appointments:", error);
      if (onError) onError(new Error(error.message || "Erro ao excluir agendamentos futuros"));
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir agendamentos futuros",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
      setProgress(0);
    }
  };

  // Function to delete all recurring appointments in a series (including past ones)
  const deleteAllRecurringAppointments = async (appointment: AppointmentType) => {
    setIsDeleting(true);
    setProgress(10);
    
    try {
      let parentId = appointment.id;
      
      // If this is a child appointment, get the parent ID
      if (appointment.parent_appointment_id) {
        parentId = appointment.parent_appointment_id;
      }
      
      setProgress(30);
      
      // Get all appointments in the same series (parent and all children)
      const { data: relatedAppointments, error: fetchError } = await supabase
        .from("appointments")
        .select("id, status, payment_status")
        .or(`id.eq.${parentId},parent_appointment_id.eq.${parentId}`);

      if (fetchError) throw fetchError;
      
      if (!relatedAppointments || relatedAppointments.length === 0) {
        throw new Error("Não foram encontrados agendamentos relacionados");
      }
      
      setProgress(60);
      
      // Show warning if there are completed/paid appointments
      const completedAppointments = relatedAppointments.filter(apt => 
        apt.status === "finalizado" || apt.payment_status === "pago"
      );
      
      if (completedAppointments.length > 0) {
        console.warn(`${completedAppointments.length} agendamentos já finalizados/pagos serão excluídos`);
      }
      
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
        description: `${appointmentIds.length} agendamentos da série excluídos com sucesso`,
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
      setIsDeleting(false);
      setProgress(0);
    }
  };

  return {
    isDeleting,
    progress,
    deleteSingleAppointment,
    deleteFutureRecurringAppointments,
    deleteAllRecurringAppointments
  };
};
