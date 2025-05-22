
import React from "react";
import ServiceCard from "./ServiceCard";
import { Appointment } from "./PendingPaymentsByClient";

interface ServiceListProps {
  appointments: Appointment[];
  selectedAppointmentIds: string[];
  toggleAppointmentSelection: (id: string, isSelected: boolean) => void;
  setSelectedAppointment: (appointment: Appointment) => void;
  handlePayment: (appointment: Appointment, method?: string) => void;
  updateAppointmentPrice: (id: string, price: number) => void;
  clientPhone?: string;
  clientName?: string;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
}

const ServiceList: React.FC<ServiceListProps> = ({
  appointments,
  selectedAppointmentIds,
  toggleAppointmentSelection,
  setSelectedAppointment,
  handlePayment,
  updateAppointmentPrice,
  clientPhone,
  clientName,
  paymentMethod,
  setPaymentMethod
}) => {
  if (!appointments.length) {
    return <div className="text-center py-8 text-muted-foreground">Nenhum serviço pendente encontrado.</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-3">Serviços Pendentes</h2>
      
      {appointments.map((appointment) => (
        <ServiceCard
          key={appointment.id}
          appointment={appointment}
          isSelected={selectedAppointmentIds.includes(appointment.id)}
          onToggleSelect={toggleAppointmentSelection}
          onEdit={setSelectedAppointment}
          onPay={handlePayment}
          onUpdatePrice={updateAppointmentPrice}
          clientPhone={clientPhone}
          clientName={clientName}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
        />
      ))}
    </div>
  );
};

export default ServiceList;
