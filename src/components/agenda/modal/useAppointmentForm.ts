
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { AppointmentStatus, allowedAppointmentStatus } from "./AppointmentStatusSelect";
import { PaymentStatus, allowedPaymentStatus } from "./AppointmentPaymentStatusSelect";

// Types
type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  clients?: { name: string } | null;
  appointment_services?: Array<{
    service_id: string;
    final_price: number;
    services: { name: string; duration: number };
  }> | null;
  is_parent?: boolean;
  parent_appointment_id?: string | null;
};

type Service = Database["public"]["Tables"]["services"]["Row"];

// Schema
export const appointmentSchema = z.object({
  clientId: z.string({ required_error: "O cliente é obrigatório" }),
  serviceIds: z.array(z.string()).min(1, "Pelo menos um serviço deve ser selecionado"),
  date: z.date({ required_error: "A data é obrigatória" }),
  startTime: z.string({ required_error: "O horário é obrigatório" }),
  notes: z.string().optional(),
  status: z.enum(allowedAppointmentStatus),
  paymentStatus: z.enum(allowedPaymentStatus),
  recurrence: z.enum(["none", "weekly", "biweekly", "monthly"]).nullable().default("none"),
  recurrenceDays: z.array(z.string()).default([]),
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
      status: "agendado" as AppointmentStatus,
      paymentStatus: "não definido" as PaymentStatus,
      recurrence: "none",
      recurrenceDays: [],
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
          customPrices[service.service_id] = service.final_price;
        });
      }

      // Map database payment_status to UI values
      let uiPaymentStatus: PaymentStatus = "não definido";
      if (appointment.payment_status === "paid") {
        uiPaymentStatus = "pago";
      } else if (appointment.payment_status === "pending") {
        uiPaymentStatus = "pendente";
      } else if (appointment.payment_status === "undefined" || appointment.payment_status === null) {
        uiPaymentStatus = "não definido";
      }

      // Map database status to UI values
      let uiStatus: AppointmentStatus = "agendado";
      if (appointment.status === "scheduled") {
        uiStatus = "agendado";
      } else if (appointment.status === "cancelled") {
        uiStatus = "cancelado";
      } else if (appointment.status === "completed") {
        uiStatus = "finalizado";
      } else if (appointment.status === "pending_payment") {
        uiStatus = "pagamento pendente";
      }
      
      // For parent appointments, we use their recurrence settings
      // For child appointments, we don't show recurrence options
      const recurrenceSettings = appointment.is_parent ? {
        recurrence: appointment.recurrence as "weekly" | "biweekly" | "monthly" | "none" | null || "none",
        recurrenceDays: appointment.recurrence_days || [],
      } : {
        recurrence: "none" as const,
        recurrenceDays: [] as string[],
      };
      
      form.reset({
        clientId: appointment.client_id,
        serviceIds: appointment.appointment_services?.map(s => s.service_id) || [],
        date: startDate,
        startTime: startDate.getHours().toString().padStart(2, '0') + ":" + 
                  startDate.getMinutes().toString().padStart(2, '0'),
        notes: appointment.notes || "",
        status: uiStatus,
        paymentStatus: uiPaymentStatus,
        ...recurrenceSettings,
        customPrices: customPrices,
      });
    } else if (selectedDate) {
      form.setValue("date", selectedDate);
    }
  }, [appointment, selectedDate, form]);

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
      
      // Map UI status to database values
      let dbStatus: string;
      switch(values.status) {
        case "agendado": dbStatus = "scheduled"; break;
        case "cancelado": dbStatus = "cancelled"; break;
        case "finalizado": dbStatus = "completed"; break;
        case "pagamento pendente": dbStatus = "pending_payment"; break;
        default: dbStatus = "scheduled";
      }

      // Map UI payment status to database values
      let dbPaymentStatus: string;
      switch(values.paymentStatus) {
        case "pago": dbPaymentStatus = "paid"; break;
        case "pendente": dbPaymentStatus = "pending"; break;
        case "não definido": dbPaymentStatus = "undefined"; break;
        default: dbPaymentStatus = "undefined";
      }
      
      // Determine if this is a parent appointment being edited
      const isParentAppointment = appointment?.is_parent || false;
      const hasParent = appointment?.parent_appointment_id !== null && appointment?.parent_appointment_id !== undefined;
      
      // Prepare appointment data
      const appointmentData = {
        client_id: values.clientId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        notes: values.notes,
        status: dbStatus,
        payment_status: dbPaymentStatus,
        final_price: totalPrice,
        // Only update recurrence info if this is a parent appointment
        ...(isParentAppointment && {
          recurrence: values.recurrence === "none" ? null : values.recurrence,
          recurrence_days: values.recurrenceDays.length > 0 ? values.recurrenceDays : null,
        })
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
        
        // If this is a parent appointment and time/date changed, update all child appointments
        if (isParentAppointment) {
          // Get all child appointments
          const { data: childAppointments, error: fetchError } = await supabase
            .from("appointments")
            .select("id, start_time, end_time")
            .eq("parent_appointment_id", appointment.id);
            
          if (fetchError) throw fetchError;
          
          if (childAppointments && childAppointments.length > 0) {
            // Calculate the time difference between old and new start time
            const oldStartTime = new Date(appointment.start_time);
            const timeDiff = startDate.getTime() - oldStartTime.getTime();
            
            // Update each child appointment with the same time difference
            const childUpdates = childAppointments.map(child => {
              const childStartTime = new Date(child.start_time);
              const childEndTime = new Date(child.end_time);
              
              const newChildStartTime = new Date(childStartTime.getTime() + timeDiff);
              const newChildEndTime = new Date(childEndTime.getTime() + timeDiff);
              
              return {
                id: child.id,
                start_time: newChildStartTime.toISOString(),
                end_time: newChildEndTime.toISOString(),
                notes: values.notes,
                status: dbStatus,
                payment_status: dbPaymentStatus,
                final_price: totalPrice,
              };
            });
            
            // Update all child appointments in a single batch
            for (const childUpdate of childUpdates) {
              const { id, ...updateData } = childUpdate;
              const { error: updateError } = await supabase
                .from("appointments")
                .update(updateData)
                .eq("id", id);
                
              if (updateError) {
                console.error(`Error updating child appointment ${id}:`, updateError);
              }
            }
          }
        }
      } else {
        // Create new appointment
        const { data, error } = await supabase
          .from("appointments")
          .insert({
            ...appointmentData,
            is_parent: false, // New single appointments are not parents
            parent_appointment_id: null,
            recurrence: null,
            recurrence_days: null,
            recurrence_count: null,
          })
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
            final_price: customPrice !== undefined ? customPrice : defaultPrice,
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
          paymentStatus: "não definido",
          recurrence: "none",
          recurrenceDays: [],
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
