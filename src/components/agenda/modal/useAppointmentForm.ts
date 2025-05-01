
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

// Types
type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  clients?: { name: string } | null;
  appointment_services?: Array<{
    service_id: string;
    price: number;
    services: { name: string; duration: number };
  }> | null;
};

type Service = Database["public"]["Tables"]["services"]["Row"];

// Schema
export const appointmentSchema = z.object({
  clientId: z.string({ required_error: "O cliente é obrigatório" }),
  serviceIds: z.array(z.string()).min(1, "Pelo menos um serviço deve ser selecionado"),
  date: z.date({ required_error: "A data é obrigatória" }),
  startTime: z.string({ required_error: "O horário é obrigatório" }),
  notes: z.string().optional(),
  status: z.enum(["agendado", "cancelado", "finalizado"]),
  paymentStatus: z.enum(["pendente", "pago"]).nullable(),
  customPrices: z.record(z.string(), z.number()).optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface UseAppointmentFormProps {
  appointment?: Appointment | null;
  onSuccess?: () => void;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  services: Service[];
}

export const useAppointmentForm = ({
  appointment,
  onSuccess,
  onOpenChange,
  selectedDate,
  services,
}: UseAppointmentFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientId: "",
      serviceIds: [],
      date: selectedDate || new Date(),
      startTime: "09:00",
      notes: "",
      status: "agendado",
      paymentStatus: null,
      customPrices: {},
    },
  });

  // Update form when appointment changes
  useEffect(() => {
    if (appointment) {
      const startDate = new Date(appointment.start_time);
      const customPrices: Record<string, number> = {};
      
      // Create custom prices map from existing appointment services
      if (appointment.appointment_services) {
        appointment.appointment_services.forEach(service => {
          customPrices[service.service_id] = service.price;
        });
      }
      
      // Map database status values to form values
      const formStatus = mapDatabaseStatusToForm(appointment.status);
      const formPaymentStatus = mapDatabasePaymentStatusToForm(appointment.payment_status);
      
      form.reset({
        clientId: appointment.client_id,
        serviceIds: appointment.appointment_services?.map(s => s.service_id) || [],
        date: startDate,
        startTime: startDate.getHours().toString().padStart(2, '0') + ":" + 
                  startDate.getMinutes().toString().padStart(2, '0'),
        notes: appointment.notes || "",
        status: formStatus,
        paymentStatus: formPaymentStatus,
        customPrices: customPrices,
      });
    } else if (selectedDate) {
      form.setValue("date", selectedDate);
    }
  }, [appointment, selectedDate, form]);

  // Helper functions to map between database and form status values
  const mapDatabaseStatusToForm = (dbStatus: string): "agendado" | "cancelado" | "finalizado" => {
    switch (dbStatus) {
      case "scheduled": return "agendado";
      case "cancelled": return "cancelado";
      case "completed": return "finalizado";
      default: return "agendado";
    }
  };

  const mapDatabasePaymentStatusToForm = (dbStatus: string | null): "pendente" | "pago" | null => {
    if (dbStatus === null) return null;
    switch (dbStatus) {
      case "pending": return "pendente";
      case "paid": return "pago";
      default: return null;
    }
  };

  // Helper functions to map from form values to database values
  const mapFormStatusToDatabase = (formStatus: string): string => {
    switch (formStatus) {
      case "agendado": return "scheduled";
      case "cancelado": return "cancelled";
      case "finalizado": return "completed";
      default: return "scheduled";
    }
  };

  const mapFormPaymentStatusToDatabase = (formStatus: string | null): string | null => {
    if (formStatus === null) return null;
    switch (formStatus) {
      case "pendente": return "pending";
      case "pago": return "paid";
      default: return null;
    }
  };

  const calculateEndTime = (values: AppointmentFormValues) => {
    const selectedServices = services.filter(service => 
      values.serviceIds.includes(service.id)
    );
    
    // Calculate total duration
    const totalDuration = selectedServices.reduce(
      (total, service) => total + (service.duration || 30),
      0
    );
    
    // Get start time
    const [hours, minutes] = values.startTime.split(":").map(Number);
    const startDate = new Date(values.date);
    startDate.setHours(hours, minutes, 0, 0);
    
    // Calculate end time
    const endDate = addMinutes(startDate, totalDuration);
    
    return { startDate, endDate, totalDuration };
  };

  const onSubmit = async (values: AppointmentFormValues) => {
    setSubmitting(true);
    
    try {
      const { startDate, endDate } = calculateEndTime(values);
      
      // Calculate total price using custom prices
      const selectedServices = services.filter(service => 
        values.serviceIds.includes(service.id)
      );
      
      const totalPrice = selectedServices.reduce((total, service) => {
        const customPrice = values.customPrices?.[service.id];
        return total + (customPrice !== undefined ? customPrice : service.price);
      }, 0);
      
      // Map form status values to database values
      const dbStatus = mapFormStatusToDatabase(values.status);
      const dbPaymentStatus = mapFormPaymentStatusToDatabase(values.paymentStatus);
      
      // Prepare appointment data
      const appointmentData = {
        client_id: values.clientId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        notes: values.notes,
        status: dbStatus,
        payment_status: dbPaymentStatus,
        final_price: totalPrice,
      };
      
      let appointmentId = appointment?.id;
      
      // Create or update appointment
      if (appointment) {
        // Update existing appointment
        const { error } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", appointment.id);
          
        if (error) throw error;
        
        // Delete old services
        const { error: deleteError } = await supabase
          .from("appointment_services")
          .delete()
          .eq("appointment_id", appointment.id);
          
        if (deleteError) throw deleteError;
      } else {
        // Create new appointment
        const { data, error } = await supabase
          .from("appointments")
          .insert(appointmentData)
          .select("id")
          .single();
          
        if (error) throw error;
        appointmentId = data.id;
      }
      
      // Add services to appointment with custom prices
      if (appointmentId) {
        const appointmentServices = values.serviceIds.map(serviceId => {
          const customPrice = values.customPrices?.[serviceId];
          const defaultPrice = services.find(s => s.id === serviceId)?.price || 0;
          
          return {
            appointment_id: appointmentId!,
            service_id: serviceId,
            price: customPrice !== undefined ? customPrice : defaultPrice,
          };
        });
        
        const { error } = await supabase
          .from("appointment_services")
          .insert(appointmentServices);
          
        if (error) throw error;
      }
      
      toast({
        title: "Sucesso",
        description: appointment 
          ? "Agendamento atualizado com sucesso"
          : "Agendamento criado com sucesso",
      });
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
      // Reset form if new appointment
      if (!appointment) {
        form.reset({
          clientId: "",
          serviceIds: [],
          date: selectedDate || new Date(),
          startTime: "09:00",
          notes: "",
          status: "agendado",
          paymentStatus: null,
          customPrices: {},
        });
      }
    } catch (error: any) {
      console.error("Erro ao salvar agendamento:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o agendamento",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    submitting,
    onSubmit: form.handleSubmit(onSubmit),
  };
};
