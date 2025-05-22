
import React, { useState, useEffect } from "react";
import { Search, PrinterIcon, DownloadIcon, BarChart3Icon } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogEditPayment } from "@/components/payment/DialogEditPayment";
import { usePaymentManagement } from "@/hooks/usePaymentManagement";
import PendingPaymentsByClient from "@/components/payment/PendingPaymentsByClient";
import PaidAppointmentsTable from "@/components/payment/PaidAppointmentsTable";
import { Input } from "@/components/ui/input";
import { removeDiacritics } from "@/lib/utils";
import PaymentFilters, { PaymentFilters as PaymentFiltersType } from "@/components/payment/PaymentFilters";
import PaymentStats from "@/components/payment/PaymentStats";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format, isAfter, isBefore, startOfDay } from "date-fns";

const Pagamentos: React.FC = () => {
  const {
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
    updateAppointmentPrice
  } = usePaymentManagement();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<PaymentFiltersType>({
    dateRange: { from: null, to: null },
    paymentMethod: null,
    minAmount: null,
    maxAmount: null,
    serviceType: null
  });
  
  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (activeFilters.dateRange.from || activeFilters.dateRange.to) count++;
    if (activeFilters.paymentMethod) count++;
    if (activeFilters.minAmount !== null || activeFilters.maxAmount !== null) count++;
    if (activeFilters.serviceType) count++;
    return count;
  };
  
  // Apply filters to pending payments
  const filteredPendingPayments = pendingPaymentsByClient
    .filter(clientGroup => {
      // First apply search filter
      if (searchTerm.trim() !== "") {
        const normalizedClientName = removeDiacritics(clientGroup.client_name.toLowerCase());
        const normalizedSearchTerm = removeDiacritics(searchTerm.toLowerCase());
        if (!normalizedClientName.includes(normalizedSearchTerm)) {
          return false;
        }
      }
      
      // Then apply other filters
      // We filter at the client group level if any appointment passes the filters
      return clientGroup.appointments.some(appointment => {
        // Payment method filter
        if (activeFilters.paymentMethod && 
            appointment.payment_method && 
            appointment.payment_method !== activeFilters.paymentMethod) {
          return false;
        }
        
        // Date range filter
        const appointmentDate = new Date(appointment.start_time);
        if (activeFilters.dateRange.from && 
            isBefore(appointmentDate, startOfDay(activeFilters.dateRange.from))) {
          return false;
        }
        if (activeFilters.dateRange.to && 
            isAfter(appointmentDate, startOfDay(activeFilters.dateRange.to))) {
          return false;
        }
        
        // Amount range filter
        const price = appointment.final_price || 0;
        if (activeFilters.minAmount !== null && price < activeFilters.minAmount) {
          return false;
        }
        if (activeFilters.maxAmount !== null && price > activeFilters.maxAmount) {
          return false;
        }
        
        // Service type filter
        if (activeFilters.serviceType && 
            !appointment.appointment_services.some(service => 
              service.service?.name.toLowerCase().includes(activeFilters.serviceType!.toLowerCase())
            )) {
          return false;
        }
        
        return true;
      });
    });
  
  // Apply filters to paid appointments
  const filteredPaidAppointments = paidAppointments
    .filter(appointment => {
      // Payment method filter
      if (activeFilters.paymentMethod && 
          appointment.payment_method && 
          appointment.payment_method !== activeFilters.paymentMethod) {
        return false;
      }
      
      // Date range filter
      const appointmentDate = new Date(appointment.start_time);
      if (activeFilters.dateRange.from && 
          isBefore(appointmentDate, startOfDay(activeFilters.dateRange.from))) {
        return false;
      }
      if (activeFilters.dateRange.to && 
          isAfter(appointmentDate, startOfDay(activeFilters.dateRange.to))) {
        return false;
      }
      
      // Amount range filter
      const price = appointment.final_price || 0;
      if (activeFilters.minAmount !== null && price < activeFilters.minAmount) {
        return false;
      }
      if (activeFilters.maxAmount !== null && price > activeFilters.maxAmount) {
        return false;
      }
      
      // Service type filter
      if (activeFilters.serviceType && 
          !appointment.appointment_services.some(service => 
            service.service?.name.toLowerCase().includes(activeFilters.serviceType!.toLowerCase())
          )) {
        return false;
      }
      
      return true;
    });
  
  // Calculate totals for stats
  const pendingTotal = filteredPendingPayments.reduce(
    (sum, clientGroup) => sum + clientGroup.totalDue, 0
  );
  
  const pendingCount = filteredPendingPayments.reduce(
    (sum, clientGroup) => sum + clientGroup.appointments.length, 0
  );
  
  const paidTotal = filteredPaidAppointments.reduce(
    (sum, appointment) => sum + (appointment.final_price || 0), 0
  );

  return (
    <PageContainer>
      <PageHeader 
        title="Pagamentos" 
        subtitle="Gerencie pagamentos pendentes e realizados"
      />
      
      <PaymentStats 
        pendingTotal={pendingTotal}
        paidTotal={paidTotal}
        pendingCount={pendingCount}
        paidCount={filteredPaidAppointments.length}
        recentPayments={filteredPaidAppointments.slice(0, 5)}
      />
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="relative w-full md:w-auto md:flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-md border-salon-secondary/50"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" className="gap-2">
            <PrinterIcon className="h-4 w-4" />
            <span className="hidden md:inline">Imprimir</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <DownloadIcon className="h-4 w-4" />
            <span className="hidden md:inline">Exportar</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <BarChart3Icon className="h-4 w-4" />
            <span className="hidden md:inline">Relatório</span>
          </Button>
        </div>
      </div>
      
      <PaymentFilters 
        onFilterChange={setActiveFilters}
        onClearFilters={() => setActiveFilters({
          dateRange: { from: null, to: null },
          paymentMethod: null,
          minAmount: null,
          maxAmount: null,
          serviceType: null
        })}
        activeFilterCount={countActiveFilters()}
      />

      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="paid">Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {filteredPendingPayments.length === 0 && !isLoading ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center justify-center py-8">
                <BarChart3Icon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum pagamento pendente encontrado</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {countActiveFilters() > 0 || searchTerm
                    ? "Tente ajustar os filtros ou a busca para visualizar os pagamentos pendentes."
                    : "Todos os agendamentos estão com pagamento em dia."}
                </p>
              </div>
            </Card>
          ) : (
            <PendingPaymentsByClient
              clientGroups={filteredPendingPayments}
              isLoading={isLoading}
              openCollapsibleIds={openCollapsibleIds}
              toggleCollapsible={toggleCollapsible}
              handlePayment={handlePayment}
              handlePayAllForClient={handlePayAllForClient}
              setSelectedAppointment={setSelectedAppointment}
              selectedAppointmentIds={selectedAppointmentIds}
              toggleAppointmentSelection={toggleAppointmentSelection}
              updateAppointmentPrice={updateAppointmentPrice}
              handlePaySelectedAppointments={handlePaySelectedAppointments}
            />
          )}
        </TabsContent>

        <TabsContent value="paid">
          <PaidAppointmentsTable
            appointments={filteredPaidAppointments}
            isLoading={isLoading}
            setSelectedAppointment={setSelectedAppointment}
          />
        </TabsContent>
      </Tabs>

      {selectedAppointment && (
        <DialogEditPayment
          appointment={selectedAppointment}
          open={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={(values) => {
            updateAppointmentMutation.mutate({
              id: selectedAppointment.id,
              values
            });
            setSelectedAppointment(null);
          }}
        />
      )}
    </PageContainer>
  );
};

export default Pagamentos;
