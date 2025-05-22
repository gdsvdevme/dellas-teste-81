
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { ChevronLeft } from "lucide-react";

import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useClientHistory, AppointmentWithServices } from "@/hooks/useClientHistory";
import { DialogEditPayment } from "@/components/payment/DialogEditPayment";
import { usePaymentManagement } from "@/hooks/usePaymentManagement";

// Import refactored components
import { StatisticsCards } from "@/components/client-history/StatisticsCards";
import { FilterControls } from "@/components/client-history/FilterControls";
import { AppointmentTable } from "@/components/client-history/AppointmentTable";
import { WhatsAppReportButton } from "@/components/client-history/WhatsAppReportButton";

const ClienteHistorico = () => {
  const { clientId = "" } = useParams();
  const navigate = useNavigate();
  const [date, setDate] = useState<DateRange | undefined>();
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithServices | null>(null);
  const { updateAppointmentMutation } = usePaymentManagement();
  
  const {
    clientDetails,
    appointments,
    allAppointments,
    isLoading,
    tabValue,
    setTabValue,
    searchTerm,
    setSearchTerm,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sendWhatsAppReport,
  } = useClientHistory(clientId);

  const handleRowClick = (appointment: AppointmentWithServices) => {
    setSelectedAppointment(appointment);
  };

  const handleBackToClients = () => {
    navigate("/clientes");
  };

  const handlePaymentUpdate = (values: any) => {
    if (!selectedAppointment) return;
    
    updateAppointmentMutation.mutate({
      id: selectedAppointment.id,
      values
    });
    
    setSelectedAppointment(null);
  };

  // Calculate client stats
  const totalAppointments = allAppointments.length;
  const completedAppointments = allAppointments.filter(a => a.status === "finalizado").length;
  const pendingPayments = allAppointments.filter(a => a.payment_status === "pendente").length;
  const totalSpent = allAppointments.reduce((sum, apt) => sum + (apt.final_price || 0), 0);

  // Filter appointments by tab
  const paidAppointments = allAppointments.filter(apt => apt.payment_status === "pago");
  const pendingAppointments = allAppointments.filter(apt => apt.payment_status === "pendente");
  
  if (isLoading || !clientDetails) {
    return (
      <PageContainer>
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-salon-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Button 
        variant="ghost" 
        onClick={handleBackToClients}
        className="mb-4"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Voltar para Clientes
      </Button>
      
      <PageHeader 
        title={clientDetails.name} 
        subtitle={clientDetails.phone || "Telefone não cadastrado"}
      >
        <WhatsAppReportButton 
          sendWhatsAppReport={sendWhatsAppReport} 
          paidAppointments={paidAppointments} 
        />
      </PageHeader>
      
      <StatisticsCards 
        totalAppointments={totalAppointments}
        completedAppointments={completedAppointments}
        pendingPayments={pendingPayments}
        totalSpent={totalSpent}
      />
      
      <FilterControls 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        date={date}
        setDate={setDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        startDate={startDate}
      />
      
      <Tabs value={tabValue} onValueChange={setTabValue}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="paid">Pagos</TabsTrigger>
        </TabsList>
        
        <AppointmentTable 
          appointments={appointments} 
          onRowClick={handleRowClick} 
          setSelectedAppointment={setSelectedAppointment} 
        />
      </Tabs>
      
      {selectedAppointment && (
        <DialogEditPayment
          appointment={selectedAppointment as any}
          open={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={handlePaymentUpdate}
        />
      )}
    </PageContainer>
  );
};

export default ClienteHistorico;
