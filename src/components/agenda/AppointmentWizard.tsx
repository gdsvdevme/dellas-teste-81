
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { calculateTotalPrice } from "./AgendaUtils";
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
  status: "scheduled" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid";
  recurrence: "none" | "weekly" | "biweekly" | "monthly" | null;
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

  const [formValues, setFormValues] = useState<AppointmentFormValues>({
    clientId: "",
    serviceIds: [],
    date: selectedDate || new Date(),
    startTime: "09:00",
    notes: "",
    status: "scheduled",
    paymentStatus: "pending",
    recurrence: "none",
  });

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
      
      // Calculate total price
      const totalPrice = calculateTotalPrice(selectedServices);
      
      // Prepare appointment data
      const appointmentData = {
        client_id: formValues.clientId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        notes: formValues.notes,
        status: formValues.status,
        payment_status: formValues.paymentStatus,
        final_price: totalPrice,
        recurrence: formValues.recurrence === "none" ? null : formValues.recurrence,
      };
      
      // Create appointment
      const { data, error } = await supabase
        .from("appointments")
        .insert(appointmentData)
        .select("id")
        .single();
        
      if (error) throw error;
      
      // Add appointment services
      if (data.id) {
        const appointmentServices = formValues.serviceIds.map(serviceId => {
          const service = services.find(s => s.id === serviceId);
          return {
            appointment_id: data.id,
            service_id: serviceId,
            price: service?.price || 0,
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
      setFormValues({
        clientId: "",
        serviceIds: [],
        date: new Date(),
        startTime: "09:00",
        notes: "",
        status: "scheduled",
        paymentStatus: "pending",
        recurrence: "none",
      });
      
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
          onClick={onClose}
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
                onClose();
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
