
import React, { useState } from "react";
import { Search } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogEditPayment } from "@/components/payment/DialogEditPayment";
import { usePaymentManagement } from "@/hooks/usePaymentManagement";
import PendingPaymentsByClient from "@/components/payment/PendingPaymentsByClient";
import PaidAppointmentsTable from "@/components/payment/PaidAppointmentsTable";
import { Input } from "@/components/ui/input";
import { removeDiacritics } from "@/lib/utils";

const Pagamentos: React.FC = () => {
  const {
    isLoading,
    selectedAppointment,
    setSelectedAppointment,
    openCollapsibleIds,
    toggleCollapsible,
    handlePayment,
    handlePayAllForClient,
    updateAppointmentMutation,
    pendingPaymentsByClient,
    paidAppointments,
    selectedAppointmentIds,
    toggleAppointmentSelection,
    updateAppointmentPrice
  } = usePaymentManagement();

  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter pending payments by client name
  const filteredPendingPayments = searchTerm.trim() !== "" 
    ? pendingPaymentsByClient.filter(clientGroup => {
        const normalizedClientName = removeDiacritics(clientGroup.client_name.toLowerCase());
        const normalizedSearchTerm = removeDiacritics(searchTerm.toLowerCase());
        return normalizedClientName.includes(normalizedSearchTerm);
      })
    : pendingPaymentsByClient;

  return (
    <PageContainer>
      <PageHeader 
        title="Pagamentos" 
        subtitle="Gerencie pagamentos pendentes e realizados"
      />
      
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome do cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-md border-salon-secondary/50"
        />
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="paid">Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
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
          />
        </TabsContent>

        <TabsContent value="paid">
          <PaidAppointmentsTable
            appointments={paidAppointments}
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
