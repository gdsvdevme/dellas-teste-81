
import { useState, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type Appointment, type ClientAppointments } from "@/components/payment/PendingPaymentsByClient";

export const usePaymentManagement = () => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [openCollapsibleIds, setOpenCollapsibleIds] = useState<string[]>([]);
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");
  const queryClient = useQueryClient();

  // Fetch appointments with client details
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      console.log("Fetching appointments");
      const { data, error } = await supabase
        .from('appointments')
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
        `);

      if (error) {
        toast.error("Erro ao carregar agendamentos");
        console.error("Error fetching appointments:", error);
        return [];
      }
      
      console.log("Appointments data:", data);
      return data as Appointment[];
    }
  });

  // Mutation for updating appointment status
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, values, updateRecurringAppointments = false }: { 
      id: string, 
      values: { 
        status: string, 
        payment_status: string, 
        final_price?: number, 
        payment_method?: string,
        notes?: string | null
      },
      updateRecurringAppointments?: boolean
    }) => {
      console.log("Updating appointment:", id, values);
      
      // First, get the appointment to check if it's part of a recurring series
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('recurrence_group_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Update the specific appointment
      const { data, error } = await supabase
        .from('appointments')
        .update(values)
        .eq('id', id)
        .select();

      if (error) throw error;

      // If this is part of a recurring series and we want to update all in the series
      if (updateRecurringAppointments && appointment.recurrence_group_id) {
        const { error: recurringError } = await supabase
          .from('appointments')
          .update(values)
          .eq('recurrence_group_id', appointment.recurrence_group_id)
          .neq('id', id);

        if (recurringError) throw recurringError;
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['client-appointments'] });
      toast.success("Pagamento atualizado com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar pagamento: ${error.message}`);
    }
  });

  // Handle payment with optimistic updates
  const handlePayment = useCallback((appointment: Appointment, method?: string, updateRecurring = false) => {
    // Remove from selected if it's selected
    if (selectedAppointmentIds.includes(appointment.id)) {
      setSelectedAppointmentIds(prev => prev.filter(id => id !== appointment.id));
    }
    
    // Show immediate feedback
    toast.success("Processando pagamento...");
    
    updateAppointmentMutation.mutate({
      id: appointment.id,
      values: { 
        status: "finalizado", 
        payment_status: "pago",
        payment_method: method || paymentMethod,
        // Keep the same final_price if it already exists
        ...(appointment.final_price && { final_price: appointment.final_price })
      },
      updateRecurringAppointments: updateRecurring
    });
  }, [selectedAppointmentIds, paymentMethod, updateAppointmentMutation]);

  // Handle payment for all appointments of a client
  const handlePayAllForClient = useCallback((clientId: string, appointments: Appointment[], method?: string) => {
    // Remove all client appointments from selected
    const appointmentIds = appointments.map(apt => apt.id);
    setSelectedAppointmentIds(prev => 
      prev.filter(id => !appointmentIds.includes(id))
    );
    
    toast.success(`Processando ${appointments.length} pagamentos...`);
    
    appointments.forEach(appointment => {
      updateAppointmentMutation.mutate({
        id: appointment.id,
        values: { 
          status: "finalizado", 
          payment_status: "pago",
          payment_method: method || paymentMethod,
          ...(appointment.final_price && { final_price: appointment.final_price })
        }
      });
    });
  }, [paymentMethod, updateAppointmentMutation]);

  // Handle payment for selected appointments
  const handlePaySelectedAppointments = useCallback((appointments: Appointment[], method?: string) => {
    const selectedAppointments = appointments.filter(apt => 
      selectedAppointmentIds.includes(apt.id)
    );
    
    if (selectedAppointments.length === 0) {
      toast.error("Nenhum serviço selecionado");
      return;
    }
    
    toast.success(`Processando ${selectedAppointments.length} pagamentos...`);
    
    selectedAppointments.forEach(appointment => {
      updateAppointmentMutation.mutate({
        id: appointment.id,
        values: { 
          status: "finalizado", 
          payment_status: "pago",
          payment_method: method || paymentMethod,
          ...(appointment.final_price && { final_price: appointment.final_price })
        }
      });
    });
    
    // Clear selected appointments
    setSelectedAppointmentIds([]);
  }, [selectedAppointmentIds, paymentMethod, updateAppointmentMutation]);

  // Toggle collapsible open/closed state
  const toggleCollapsible = useCallback((clientId: string) => {
    setOpenCollapsibleIds(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  }, []);

  // Toggle appointment selection
  const toggleAppointmentSelection = useCallback((appointmentId: string, isSelected: boolean) => {
    setSelectedAppointmentIds(prev => {
      if (isSelected && !prev.includes(appointmentId)) {
        return [...prev, appointmentId];
      } else if (!isSelected && prev.includes(appointmentId)) {
        return prev.filter(id => id !== appointmentId);
      }
      return prev;
    });
  }, []);

  // Update appointment price with better feedback
  const updateAppointmentPrice = useCallback((appointmentId: string, newPrice: number) => {
    console.log("Updating appointment price:", appointmentId, newPrice);
    toast.success("Atualizando preço...");
    
    updateAppointmentMutation.mutate({
      id: appointmentId,
      values: {
        status: "pagamento pendente", 
        payment_status: "pendente", 
        final_price: newPrice
      }
    });
  }, [updateAppointmentMutation]);

  // Memoized pending payments grouped by client
  const pendingPaymentsByClient = useMemo(() => {
    if (!appointments) return [];
    
    const clientMap = new Map<string, ClientAppointments>();
    
    appointments
      .filter(appointment => appointment.payment_status === 'pendente')
      .forEach(appointment => {
        const clientId = appointment.client_id;
        const clientName = appointment.client?.name || 'Cliente Desconhecido';
        const clientPhone = appointment.client?.phone || '';
        const price = appointment.final_price || 0;

        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            client_id: clientId,
            client_name: clientName,
            client_phone: clientPhone,
            appointments: [],
            totalDue: 0
          });
        }

        const client = clientMap.get(clientId)!;
        client.appointments.push(appointment);
        client.totalDue += price;
      });

    return Array.from(clientMap.values());
  }, [appointments]);

  // Memoized paid appointments
  const paidAppointments = useMemo(() => {
    return appointments ? appointments.filter(appointment => appointment.payment_status === 'pago') : [];
  }, [appointments]);

  return {
    appointments,
    isLoading,
    selectedAppointment,
    setSelectedAppointment,
    openCollapsibleIds,
    toggleCollapsible,
    handlePayment,
    handlePayAllForClient,
    handlePaySelectedAppointments,
    updateAppointmentMutation,
    pendingPaymentsByClient,
    paidAppointments,
    selectedAppointmentIds,
    toggleAppointmentSelection,
    updateAppointmentPrice,
    paymentMethod,
    setPaymentMethod
  };
};
