
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { DialogEditPayment } from "@/components/payment/DialogEditPayment";
import { usePaymentManagement } from "@/hooks/usePaymentManagement";
import ClientHeader from "@/components/payment/ClientHeader";
import PaymentControls from "@/components/payment/PaymentControls";
import ServiceList from "@/components/payment/ServiceList";

const ClientePagamento = () => {
  const { clientId } = useParams();
  const [priceInputs, setPriceInputs] = useState<Record<string, number>>({});
  
  const {
    pendingPaymentsByClient,
    isLoading,
    selectedAppointment,
    setSelectedAppointment,
    handlePayment,
    handlePayAllForClient,
    updateAppointmentMutation,
    selectedAppointmentIds,
    toggleAppointmentSelection,
    updateAppointmentPrice,
    handlePaySelectedAppointments,
    paymentMethod,
    setPaymentMethod
  } = usePaymentManagement();

  // Encontrar o grupo de cliente atual com base no clientId da URL
  const clientGroup = pendingPaymentsByClient.find(group => group.client_id === clientId);
  
  useEffect(() => {
    // Inicializa os valores de preço ao carregar a página
    if (clientGroup) {
      const inputs: Record<string, number> = {};
      clientGroup.appointments.forEach(apt => {
        inputs[apt.id] = apt.final_price || 0;
      });
      setPriceInputs(inputs);
    }
  }, [clientGroup]);

  // Calcula o total selecionado
  const selectedTotal = clientGroup?.appointments
    .filter(apt => selectedAppointmentIds.includes(apt.id))
    .reduce((sum, apt) => sum + (apt.final_price || 0), 0) || 0;

  const selectedCount = clientGroup?.appointments
    .filter(apt => selectedAppointmentIds.includes(apt.id))
    .length || 0;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-8">Carregando dados do cliente...</div>
      </PageContainer>
    );
  }

  if (!clientGroup) {
    return (
      <PageContainer>
        <ClientHeader 
          clientName="Cliente não encontrado" 
          appointmentsCount={0} 
          totalDue={0} 
        />
      </PageContainer>
    );
  }

  const areAllSelected = clientGroup.appointments.length > 0 && 
    clientGroup.appointments.every(apt => selectedAppointmentIds.includes(apt.id));

  const handleToggleAll = (checked: boolean) => {
    clientGroup.appointments.forEach(apt => {
      if (checked !== selectedAppointmentIds.includes(apt.id)) {
        toggleAppointmentSelection(apt.id, checked);
      }
    });
  };

  return (
    <PageContainer>
      <ClientHeader
        clientName={clientGroup.client_name}
        clientPhone={clientGroup.client_phone}
        appointmentsCount={clientGroup.appointments.length}
        totalDue={clientGroup.totalDue}
      />

      <PaymentControls
        selectedCount={selectedCount}
        selectedTotal={selectedTotal}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        areAllSelected={areAllSelected}
        handleToggleAll={handleToggleAll}
        onPaySelectedAppointments={handlePaySelectedAppointments}
        onPayAllForClient={handlePayAllForClient}
        clientId={clientId}
        appointments={clientGroup.appointments}
      />

      <ServiceList
        appointments={clientGroup.appointments}
        selectedAppointmentIds={selectedAppointmentIds}
        toggleAppointmentSelection={toggleAppointmentSelection}
        setSelectedAppointment={setSelectedAppointment}
        handlePayment={handlePayment}
        updateAppointmentPrice={updateAppointmentPrice}
        clientPhone={clientGroup.client_phone}
        clientName={clientGroup.client_name}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />

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

export default ClientePagamento;
