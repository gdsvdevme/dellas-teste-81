
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type AppointmentWithServices = {
  id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  final_price: number;
  payment_method: string | null;
  notes: string | null;
  created_at: string | null;
  client?: {
    id: string;
    name: string;
    phone: string | null;
  };
  appointment_services: {
    id: string;
    service_id: string;
    appointment_id: string;
    final_price: number | null;
    service?: {
      id: string;
      name: string;
      price: number;
      duration: number;
    };
  }[];
};

export type ClientDetails = {
  id: string;
  name: string;
  phone: string | null;
  created_at: string | null;
};

export const useClientHistory = (clientId: string) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [tabValue, setTabValue] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch client details
  const { data: clientDetails, isLoading: isLoadingClientDetails } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) {
        toast.error("Erro ao carregar detalhes do cliente");
        console.error("Error fetching client details:", error);
        return null;
      }
      
      return data as ClientDetails;
    },
  });

  // Fetch client appointments with services
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["client-appointments", clientId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          client:client_id (
            id,
            name,
            phone
          ),
          appointment_services (
            *,
            service:service_id (
              id,
              name,
              price,
              duration
            )
          )
        `)
        .eq("client_id", clientId)
        .order("start_time", { ascending: false });

      // Apply date filters if they exist
      if (startDate) {
        query = query.gte("start_time", format(startDate, "yyyy-MM-dd"));
      }
      
      if (endDate) {
        // Add one day to include the end date fully
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query = query.lt("start_time", format(nextDay, "yyyy-MM-dd"));
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Erro ao carregar histórico do cliente");
        console.error("Error fetching client appointments:", error);
        return [];
      }
      
      return data as AppointmentWithServices[];
    },
  });

  // Filter appointments based on tab and search
  const filteredAppointments = appointments.filter((appointment) => {
    // Filter by tab value
    if (tabValue === "pending" && appointment.payment_status !== "pendente") {
      return false;
    }
    
    if (tabValue === "paid" && appointment.payment_status !== "pago") {
      return false;
    }
    
    // Filter by search term if provided
    if (searchTerm) {
      const normalizedSearch = searchTerm.toLowerCase();
      
      // Search in services
      const hasMatchingService = appointment.appointment_services.some(
        (as) => as.service?.name.toLowerCase().includes(normalizedSearch)
      );
      
      // Search in notes
      const hasMatchingNotes = appointment.notes?.toLowerCase().includes(normalizedSearch);
      
      return hasMatchingService || hasMatchingNotes;
    }
    
    return true;
  });

  // Generate WhatsApp report for selected appointments
  const generateWhatsAppReport = (appointments: AppointmentWithServices[]) => {
    if (!clientDetails) return "";
    
    // Sort appointments by date
    const sortedAppointments = [...appointments].sort((a, b) => {
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });
    
    // Create the report text
    let reportText = `*Relatório de Serviços - ${clientDetails.name}*\n\n`;
    
    // Add date range if filters are applied
    if (startDate && endDate) {
      reportText += `*Período:* ${format(startDate, "dd/MM/yyyy")} a ${format(endDate, "dd/MM/yyyy")}\n\n`;
    }
    
    // Calculate total value
    let totalValue = 0;
    
    // Add each appointment to the report
    sortedAppointments.forEach((apt, index) => {
      const aptDate = new Date(apt.start_time);
      reportText += `*${index + 1}. ${format(aptDate, "dd/MM/yyyy")}*\n`;
      
      // Add services
      apt.appointment_services.forEach((as) => {
        reportText += `   • ${as.service?.name}: R$ ${as.final_price || as.service?.price || 0}\n`;
      });
      
      // Add appointment total value
      reportText += `   *Valor:* R$ ${apt.final_price}\n`;
      if (apt.payment_method) {
        reportText += `   *Pagamento:* ${apt.payment_method}\n`;
      }
      
      reportText += "\n";
      totalValue += apt.final_price || 0;
    });
    
    // Add total summary
    reportText += `*Total de serviços:* ${sortedAppointments.length}\n`;
    reportText += `*Valor total:* R$ ${totalValue.toFixed(2)}\n\n`;
    reportText += "Agradecemos pela preferência! 💇‍♀️✨";
    
    return encodeURIComponent(reportText);
  };

  // Send report via WhatsApp
  const sendWhatsAppReport = (appointments: AppointmentWithServices[]) => {
    if (!clientDetails?.phone) {
      toast.error("Cliente não possui número de telefone cadastrado");
      return;
    }
    
    const reportText = generateWhatsAppReport(appointments);
    
    // Format phone number (remove non-digits)
    const phone = clientDetails.phone.replace(/\D/g, "");
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/55${phone}?text=${reportText}`;
    
    // Open in a new tab
    window.open(whatsappUrl, "_blank");
  };

  return {
    clientDetails,
    appointments: filteredAppointments,
    allAppointments: appointments,
    isLoading: isLoadingClientDetails || isLoadingAppointments,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    tabValue,
    setTabValue,
    searchTerm,
    setSearchTerm,
    generateWhatsAppReport,
    sendWhatsAppReport,
  };
};
