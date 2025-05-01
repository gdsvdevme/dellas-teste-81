
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import AppointmentClientStep from "./wizard/AppointmentClientStep";
import AppointmentServicesStep from "./wizard/AppointmentServicesStep";
import AppointmentDateTimeStep from "./wizard/AppointmentDateTimeStep";
import AppointmentSummaryStep from "./wizard/AppointmentSummaryStep";

// Types
type Client = Database["public"]["Tables"]["clients"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];

export type AppointmentFormValues = {
  clientId: string;
  serviceIds: string[];
  date: Date;
  startTime: string;
  notes: string;
  status: "agendado" | "cancelado" | "finalizado" | "pagamento pendente";
  paymentStatus: "pendente" | "pago" | "não definido";
  recurrence: "none" | "weekly" | "biweekly" | "monthly" | null;
  recurrenceDays: string[];
  customPrices: Record<string, number>;
  recurrenceCount: number;
};

export type AppointmentStepProps = {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  formValues: AppointmentFormValues;
  updateFormValues: (values: Partial<AppointmentFormValues>) => void;
  clients: Client[];
  services: Service[];
  loadingClients: boolean;
  loadingServices: boolean;
};

interface AppointmentWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedDate?: Date;
}

const AppointmentWizard = ({ open, onClose, onSuccess, selectedDate }: AppointmentWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const getInitialFormValues = (): AppointmentFormValues => ({
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
    recurrenceCount: 1,
  });

  const [formValues, setFormValues] = useState<AppointmentFormValues>(getInitialFormValues());

  // Reset form values when the modal is closed
  useEffect(() => {
    if (!open) {
      setFormValues(getInitialFormValues());
      setCurrentStep(1);
    } else {
      // When opening, update the date to the selected date if provided
      if (selectedDate) {
        setFormValues(prev => ({
          ...prev,
          date: selectedDate
        }));
      }
    }
  }, [open, selectedDate]);

  // Load clients and services on component mount
  useEffect(() => {
    if (open) {
      fetchClients();
      fetchServices();
    }
  }, [open]);

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

  const updateFormValues = (values: Partial<AppointmentFormValues>) => {
    setFormValues((prev) => ({ ...prev, ...values }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const selectedServices = services.filter(service => 
        formValues.serviceIds.includes(service.id)
      );
      
      // Calculate total duration
      const totalDuration = selectedServices.reduce(
        (total, service) => total + (service.duration || 30),
        0
      );
      
      // Calculate start and end times
      const [hours, minutes] = formValues.startTime.split(":").map(Number);
      const startDate = new Date(formValues.date);
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = new Date(startDate.getTime() + totalDuration * 60000);
      
      // Calculate total price from custom prices
      const totalPrice = selectedServices.reduce((total, service) => {
        const customPrice = formValues.customPrices[service.id];
        return total + (customPrice !== undefined ? customPrice : service.price);
      }, 0);
      
      // Map status values to database format
      const dbStatus = mapFormStatusToDatabase(formValues.status);
      const dbPaymentStatus = mapFormPaymentStatusToDatabase(formValues.paymentStatus);
      
      // Prepare appointment data
      const appointmentData = {
        client_id: formValues.clientId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        notes: formValues.notes,
        status: dbStatus,
        payment_status: dbPaymentStatus,
        final_price: totalPrice,
        recurrence: formValues.recurrence === "none" ? null : formValues.recurrence,
        recurrence_days: formValues.recurrenceDays.length > 0 ? formValues.recurrenceDays : null,
        recurrence_count: formValues.recurrenceCount || 1,
      };
      
      // Create appointment
      const { data, error } = await supabase
        .from("appointments")
        .insert(appointmentData)
        .select("id")
        .single();
        
      if (error) throw error;
      
      // Add appointment services with custom prices
      if (data.id) {
        const appointmentServices = formValues.serviceIds.map(serviceId => {
          const customPrice = formValues.customPrices[serviceId];
          const defaultPrice = services.find(s => s.id === serviceId)?.price || 0;
          
          return {
            appointment_id: data.id,
            service_id: serviceId,
            final_price: customPrice !== undefined ? customPrice : defaultPrice,
          };
        });
        
        const { error: servicesError } = await supabase
          .from("appointment_services")
          .insert(appointmentServices);
          
        if (servicesError) throw servicesError;
      }
      
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso",
      });
      
      // Reset form and close modal
      setCurrentStep(1);
      setFormValues(getInitialFormValues());
      
      onClose();
      if (onSuccess) onSuccess();
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

  // Helper functions to map between form values and database values
  const mapFormStatusToDatabase = (formStatus: string): string => {
    switch (formStatus) {
      case "agendado": return "scheduled";
      case "cancelado": return "cancelled";
      case "finalizado": return "completed";
      case "pagamento pendente": return "pending_payment";
      default: return "scheduled";
    }
  };

  const mapFormPaymentStatusToDatabase = (formStatus: string): string => {
    switch (formStatus) {
      case "pendente": return "pending";
      case "pago": return "paid";
      case "não definido": return "undefined"; // Use "undefined" string instead of null
      default: return "undefined";
    }
  };

  // Create a wrapper function for onClose that ensures form reset
  const handleClose = () => {
    onClose();
  };

  // If not open, don't render
  if (!open) return null;

  const stepProps: AppointmentStepProps = {
    currentStep,
    setCurrentStep,
    formValues,
    updateFormValues,
    clients,
    services,
    loadingClients,
    loadingServices,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-xl bg-background rounded-lg shadow p-6 m-4">
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Novo Agendamento</h2>
          <div className="text-sm text-gray-500">
            Passo {currentStep} de 4
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
          <div 
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>

        {/* Step content */}
        <div className="mb-6">
          {currentStep === 1 && <AppointmentClientStep {...stepProps} />}
          {currentStep === 2 && <AppointmentServicesStep {...stepProps} />}
          {currentStep === 3 && <AppointmentDateTimeStep {...stepProps} />}
          {currentStep === 4 && <AppointmentSummaryStep {...stepProps} />}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (currentStep === 1) {
                handleClose();
              } else {
                setCurrentStep(prev => prev - 1);
              }
            }}
          >
            {currentStep === 1 ? "Cancelar" : "Anterior"}
          </Button>

          <Button
            type="button"
            disabled={submitting || 
              (currentStep === 1 && !formValues.clientId) ||
              (currentStep === 2 && formValues.serviceIds.length === 0)
            }
            onClick={() => {
              if (currentStep === 4) {
                handleSubmit();
              } else {
                setCurrentStep(prev => prev + 1);
              }
            }}
          >
            {submitting ? (
              <div className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                Processando...
              </div>
            ) : currentStep === 4 ? (
              "Confirmar Agendamento"
            ) : (
              "Próximo"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentWizard;
