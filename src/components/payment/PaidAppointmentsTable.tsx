
import React from "react";
import { format } from "date-fns";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { type Appointment } from "./PendingPaymentsByClient";

interface PaidAppointmentsTableProps {
  appointments: Appointment[];
  isLoading: boolean;
  setSelectedAppointment: (appointment: Appointment | null) => void;
}

const PaidAppointmentsTable = ({
  appointments,
  isLoading,
  setSelectedAppointment
}: PaidAppointmentsTableProps) => {
  // Table columns for paid appointments
  const paidColumns = [
    {
      header: "Data",
      accessorKey: (appointment: Appointment) => appointment.start_time,
      cell: (info: any) => {
        const date = info.row.original.start_time;
        return date ? format(new Date(date), "dd/MM/yyyy HH:mm") : "Data não disponível";
      }
    },
    {
      header: "Cliente",
      accessorKey: (appointment: Appointment) => appointment.client?.name || "",
      cell: (info: any) => info.row.original.client?.name || "Cliente não especificado"
    },
    {
      header: "Serviço",
      accessorKey: (appointment: Appointment) => {
        const services = appointment.appointment_services || [];
        return services.length > 0
          ? services.map((as: any) => as.service?.name).filter(Boolean).join(", ")
          : "Não especificado";
      },
      cell: (info: any) => {
        const services = info.row.original.appointment_services || [];
        return services.length > 0
          ? services.map((as: any) => as.service?.name).filter(Boolean).join(", ")
          : "Não especificado";
      }
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Appointment,
      cell: (info: any) => (
        <StatusBadge variant={info.row.original.status === "finalizado" ? "success" : "warning"}>
          {info.row.original.status === "finalizado" ? "Finalizado" : "Agendado"}
        </StatusBadge>
      )
    },
    {
      header: "Valor",
      accessorKey: "final_price" as keyof Appointment,
      cell: (info: any) => `R$ ${info.row.original.final_price || 0}`
    },
    {
      header: "Ações",
      accessorKey: "id" as keyof Appointment,
      cell: (info: any) => (
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => setSelectedAppointment(info.row.original)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )
    }
  ];

  if (isLoading) {
    return <div className="flex justify-center py-8">Carregando pagamentos realizados...</div>;
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Não há pagamentos realizados</p>
      </div>
    );
  }

  return (
    <DataTable
      data={appointments}
      columns={paidColumns}
      searchField={(appointment: Appointment) => appointment.client?.name || ""}
    />
  );
};

export default PaidAppointmentsTable;
