
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { i18n } from "@/lib/i18n";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import AppointmentClientSelect from "./modal/AppointmentClientSelect";
import AppointmentServiceSelect from "./modal/AppointmentServiceSelect";
import AppointmentDateSelect from "./modal/AppointmentDateSelect";
import AppointmentTimeSelect from "./modal/AppointmentTimeSelect";
import AppointmentNotesField from "./modal/AppointmentNotesField";
import AppointmentStatusSelect from "./modal/AppointmentStatusSelect";
import AppointmentPaymentStatusSelect from "./modal/AppointmentPaymentStatusSelect";
import { useAppointmentForm } from "./modal/useAppointmentForm";

// Types
type Client = Database["public"]["Tables"]["clients"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];

// Updated Appointment type with the price field in appointment_services
type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  clients?: { name: string } | null;
  appointment_services?: Array<{
    service_id: string;
    price: number;
    services: { name: string; duration: number };
  }> | null;
};

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  onSuccess?: () => void;
  selectedDate?: Date;
}

const AppointmentModal = ({
  open,
  onOpenChange,
  appointment,
  onSuccess,
  selectedDate,
}: AppointmentModalProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  // Use the custom hook for form handling
  const { form, submitting, onSubmit } = useAppointmentForm({
    appointment,
    onSuccess,
    onOpenChange,
    selectedDate,
    services,
  });

  // Load clients and services
  useEffect(() => {
    fetchClients();
    fetchServices();
  }, []);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");

      if (error) {
        console.error("Erro ao carregar clientes:", error);
      } else {
        setClients(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name");

      if (error) {
        console.error("Erro ao carregar serviços:", error);
      } else {
        setServices(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
    } finally {
      setLoadingServices(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {appointment ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Client */}
            <AppointmentClientSelect 
              clients={clients} 
              loadingClients={loadingClients} 
              form={form} 
            />

            {/* Services */}
            <AppointmentServiceSelect 
              services={services} 
              form={form} 
            />

            {/* Date */}
            <AppointmentDateSelect form={form} />

            {/* Time */}
            <AppointmentTimeSelect form={form} />

            {/* Notes */}
            <AppointmentNotesField form={form} />

            {/* Status and Payment Status */}
            <div className="grid grid-cols-2 gap-4">
              <AppointmentStatusSelect form={form} />
              <AppointmentPaymentStatusSelect form={form} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {i18n.system.cancel}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                    {i18n.system.loading}
                  </div>
                ) : appointment ? (
                  i18n.system.save
                ) : (
                  "Agendar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentModal;
