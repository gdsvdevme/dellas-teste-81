
import React from "react";
import ClientPaymentCard from "./ClientPaymentCard";

// Types
export type Appointment = {
  id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  payment_method?: string;  
  final_price: number | null;
  notes: string | null;
  client: {
    name: string;
    phone?: string;
  };
  appointment_services: {
    service: {
      name: string;
    };
  }[];
};

export type ClientAppointments = {
  client_id: string;
  client_name: string;
  client_phone?: string;
  appointments: Appointment[];
  totalDue: number;
};

interface PendingPaymentsByClientProps {
  clientGroups: ClientAppointments[];
  isLoading: boolean;
  openCollapsibleIds: string[];
  toggleCollapsible: (clientId: string) => void;
  handlePayment: (appointment: Appointment, method?: string) => void;
  handlePayAllForClient: (clientId: string, appointments: Appointment[], method?: string) => void;
  setSelectedAppointment: (appointment: Appointment | null) => void;
  selectedAppointmentIds: string[];
  toggleAppointmentSelection: (appointmentId: string, isSelected: boolean) => void;
  updateAppointmentPrice: (appointmentId: string, newPrice: number) => void;
  handlePaySelectedAppointments?: (appointments: Appointment[], method?: string) => void;
}

const PendingPaymentsByClient = ({
  clientGroups,
  isLoading,
  openCollapsibleIds,
  toggleCollapsible,
  handlePayment,
  handlePayAllForClient,
  setSelectedAppointment,
  selectedAppointmentIds,
  toggleAppointmentSelection,
  updateAppointmentPrice,
  handlePaySelectedAppointments
}: PendingPaymentsByClientProps) => {
  if (isLoading) {
    return <div className="flex justify-center py-8">Carregando pagamentos pendentes...</div>;
  }
  
  if (clientGroups.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Não há pagamentos pendentes</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clientGroups.map((clientGroup) => (
        <ClientPaymentCard
          key={clientGroup.client_id}
          clientId={clientGroup.client_id}
          clientName={clientGroup.client_name}
          clientPhone={clientGroup.client_phone}
          appointments={clientGroup.appointments}
          totalDue={clientGroup.totalDue}
          isOpen={openCollapsibleIds.includes(clientGroup.client_id)}
          onToggleOpen={() => toggleCollapsible(clientGroup.client_id)}
          onPayment={handlePayment}
          onPayAll={handlePayAllForClient}
          onEdit={setSelectedAppointment}
          selectedIds={selectedAppointmentIds}
          onToggleSelect={toggleAppointmentSelection}
          onUpdatePrice={updateAppointmentPrice}
          onPaySelected={handlePaySelectedAppointments}
        />
      ))}
    </div>
  );
};

export default PendingPaymentsByClient;
