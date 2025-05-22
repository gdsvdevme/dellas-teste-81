
import { Edit, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { AppointmentWithServices } from "@/hooks/useClientHistory";

interface AppointmentTableProps {
  appointments: AppointmentWithServices[];
  onRowClick: (appointment: AppointmentWithServices) => void;
  setSelectedAppointment: (appointment: AppointmentWithServices) => void;
}

export const AppointmentTable = ({
  appointments,
  onRowClick,
  setSelectedAppointment,
}: AppointmentTableProps) => {
  // Configure columns for the appointment tables
  const appointmentColumns = [
    {
      header: "Data",
      accessorKey: "start_time" as keyof AppointmentWithServices,
      cell: ({ row }: { row: { original: AppointmentWithServices } }) => (
        <span>{format(new Date(row.original.start_time), "dd/MM/yyyy HH:mm")}</span>
      ),
    },
    {
      header: "Serviços",
      accessorKey: (row: AppointmentWithServices) => row.appointment_services?.map(s => s.service?.name).join(", "),
      cell: ({ row }: { row: { original: AppointmentWithServices } }) => (
        <div>
          {row.original.appointment_services?.map((as, i) => (
            <Badge key={i} variant="outline" className="mr-1 mb-1">
              {as.service?.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status" as keyof AppointmentWithServices,
      cell: ({ row }: { row: { original: AppointmentWithServices } }) => (
        <StatusBadge variant={row.original.status === "finalizado" ? "success" : "warning"}>
          {row.original.status === "finalizado" ? "Finalizado" : "Agendado"}
        </StatusBadge>
      ),
    },
    {
      header: "Pagamento",
      accessorKey: "payment_status" as keyof AppointmentWithServices,
      cell: ({ row }: { row: { original: AppointmentWithServices } }) => (
        <StatusBadge variant={row.original.payment_status === "pago" ? "success" : "warning"}>
          {row.original.payment_status === "pago" ? "Pago" : "Pendente"}
        </StatusBadge>
      ),
    },
    {
      header: "Valor",
      accessorKey: "final_price" as keyof AppointmentWithServices,
      cell: ({ row }: { row: { original: AppointmentWithServices } }) => (
        <span className="font-medium">
          R$ {row.original.final_price || "Não definido"}
        </span>
      ),
    },
    {
      header: "Ações",
      accessorKey: (row: AppointmentWithServices) => row.id,
      cell: ({ row }: { row: { original: AppointmentWithServices } }) => (
        <Button 
          size="sm" 
          variant="salon"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedAppointment(row.original);
          }}
          className="w-full flex items-center justify-center"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      ),
    },
  ];

  return (
    <>
      {appointments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum registro encontrado</h3>
            <p className="text-muted-foreground text-center mt-2">
              Tente ajustar os filtros para ver mais resultados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="p-4">
              <DataTable
                data={appointments}
                columns={appointmentColumns}
                onRowClick={onRowClick}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
