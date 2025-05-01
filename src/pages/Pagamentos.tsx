
import React from "react";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogEditPayment } from "@/components/payment/DialogEditPayment";
import { usePaymentManagement } from "@/hooks/usePaymentManagement";
import PendingPaymentsByClient from "@/components/payment/PendingPaymentsByClient";
import PaidAppointmentsTable from "@/components/payment/PaidAppointmentsTable";

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
    paidAppointments
  } = usePaymentManagement();

  return (
    <PageContainer>
      <PageHeader 
        title="Pagamentos" 
        subtitle="Gerencie pagamentos pendentes e realizados"
      />

      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="paid">Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PendingPaymentsByClient
            clientGroups={pendingPaymentsByClient}
            isLoading={isLoading}
            openCollapsibleIds={openCollapsibleIds}
            toggleCollapsible={toggleCollapsible}
            handlePayment={handlePayment}
            handlePayAllForClient={handlePayAllForClient}
            setSelectedAppointment={setSelectedAppointment}
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
