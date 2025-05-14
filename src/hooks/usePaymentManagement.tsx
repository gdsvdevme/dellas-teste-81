
import { useState } from "react";
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
    mutationFn: async ({ id, values }: { id: string, values: { status: string, payment_status: string, final_price?: number, payment_method?: string } }) => {
      const { error } = await supabase
        .from('appointments')
        .update(values)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success("Pagamento atualizado com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar pagamento: ${error.message}`);
    }
  });

  // Handle payment
  const handlePayment = (
    appointment: Appointment, 
    method?: string, 
    servicePrices?: Record<string, number>
  ) => {
    // Remove from selected if it's selected
    if (selectedAppointmentIds.includes(appointment.id)) {
      setSelectedAppointmentIds(prev => prev.filter(id => id !== appointment.id));
    }
    
    // Calculate final price from service prices if provided
    let finalPrice = appointment.final_price;
    if (servicePrices) {
      finalPrice = Object.values(servicePrices).reduce((sum, price) => sum + price, 0);
    }
    
    updateAppointmentMutation.mutate({
      id: appointment.id,
      values: { 
        status: "finalizado", 
        payment_status: "pago",
        payment_method: method || paymentMethod,
        final_price: finalPrice
      }
    });
  };

  // Handle payment for all appointments of a client
  const handlePayAllForClient = (clientId: string, appointments: Appointment[], method?: string) => {
    // Remove all client appointments from selected
    const appointmentIds = appointments.map(apt => apt.id);
    setSelectedAppointmentIds(prev => 
      prev.filter(id => !appointmentIds.includes(id))
    );
    
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
  };

  // Handle payment for selected appointments
  const handlePaySelectedAppointments = (appointments: Appointment[], method?: string) => {
    const selectedAppointments = appointments.filter(apt => 
      selectedAppointmentIds.includes(apt.id)
    );
    
    selectedAppointments.forEach(apt => {
      updateAppointmentMutation.mutate({
        id: apt.id,
        values: { 
          status: "finalizado", 
          payment_status: "pago",
          payment_method: method || paymentMethod,
          ...(apt.final_price && { final_price: apt.final_price })
        }
      });
    });
    
    // Clear selected appointments
    setSelectedAppointmentIds([]);
  };

  // Toggle collapsible open/closed state
  const toggleCollapsible = (clientId: string) => {
    setOpenCollapsibleIds(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  // Toggle appointment selection
  const toggleAppointmentSelection = (appointmentId: string, isSelected: boolean) => {
    setSelectedAppointmentIds(prev => {
      if (isSelected && !prev.includes(appointmentId)) {
        return [...prev, appointmentId];
      } else if (!isSelected && prev.includes(appointmentId)) {
        return prev.filter(id => id !== appointmentId);
      }
      return prev;
    });
  };

  // Update appointment price
  const updateAppointmentPrice = (appointmentId: string, newPrice: number) => {
    updateAppointmentMutation.mutate({
      id: appointmentId,
      values: {
        status: "pagamento pendente", // Use Portuguese value
        payment_status: "pendente", // Use Portuguese value
        final_price: newPrice
      }
    });
  };

  // Group appointments by client for pending payments
  const pendingPaymentsByClient = appointments
    ? (() => {
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
      })()
    : [];

  // Paid appointments for table display
  const paidAppointments = appointments
    ? appointments.filter(appointment => appointment.payment_status === 'pago')
    : [];

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
