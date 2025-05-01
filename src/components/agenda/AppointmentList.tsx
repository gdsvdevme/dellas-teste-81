import { useEffect, useState } from "react";
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  addDays,
  eachHourOfInterval,
  isSameDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Clock, Edit, Trash } from "lucide-react";
import AppointmentModal from "./AppointmentModal";
import { useToast } from "@/hooks/use-toast";

// Updated Appointment type to include price in appointment_services
type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  clients: { name: string } | null;
  appointment_services: Array<{
    service_id: string;
    price: number;
    services: { name: string; duration: number };
  }> | null;
};

interface AppointmentListProps {
  date: Date;
  view: "day" | "week" | "month";
}

const AppointmentList = ({ date, view }: AppointmentListProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, [date, view]);

  const fetchAppointments = async () => {
    setLoading(true);

    let startDate, endDate;

    // Definir o intervalo de datas com base na visualização
    if (view === "day") {
      startDate = startOfDay(date);
      endDate = endOfDay(date);
    } else if (view === "week") {
      startDate = startOfWeek(date, { locale: ptBR });
      endDate = endOfWeek(date, { locale: ptBR });
    } else {
      startDate = startOfMonth(date);
      endDate = endOfMonth(date);
    }

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          clients (
            name
          ),
          appointment_services (
            service_id,
            price,
            services (
              name,
              duration
            )
          )
        `)
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString())
        .order("start_time");

      if (error) {
        console.error("Erro ao buscar agendamentos:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os agendamentos",
          variant: "destructive",
        });
      } else {
        setAppointments(data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Erro ao excluir agendamento:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o agendamento",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Agendamento excluído com sucesso",
        });
        fetchAppointments();
      }
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
    }
  };

  // Renderização baseada na visualização selecionada
  if (view === "day") {
    const hours = eachHourOfInterval({
      start: new Date(date.setHours(8, 0, 0, 0)),
      end: new Date(date.setHours(18, 0, 0, 0)),
    });

    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Agendamentos do Dia</h2>
        
        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-1">
            {hours.map((hour) => {
              const hourAppointments = appointments.filter((apt) => {
                const aptDate = new Date(apt.start_time);
                return aptDate.getHours() === hour.getHours();
              });

              return (
                <div key={hour.toString()} className="border-t py-2">
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(hour, "HH:mm")}
                  </div>
                  
                  {hourAppointments.length > 0 ? (
                    hourAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onEdit={() => setEditAppointment(appointment)}
                        onDelete={() => handleDelete(appointment.id)}
                      />
                    ))
                  ) : (
                    <div className="h-12 px-3 py-2 text-sm text-gray-400 italic border-l-2 border-transparent">
                      Sem agendamentos
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de edição */}
        <AppointmentModal
          open={!!editAppointment}
          onOpenChange={() => setEditAppointment(null)}
          appointment={editAppointment}
          onSuccess={fetchAppointments}
          selectedDate={date}
        />
      </div>
    );
  }

  if (view === "week") {
    const weekStart = startOfWeek(date, { locale: ptBR });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Agendamentos da Semana</h2>
        
        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => (
              <div key={day.toString()} className="border rounded-md p-2">
                <div className="text-center font-medium mb-2">
                  <div>{format(day, "EEE", { locale: ptBR })}</div>
                  <div>{format(day, "dd", { locale: ptBR })}</div>
                </div>

                <div className="space-y-1">
                  {appointments
                    .filter((apt) => isSameDay(new Date(apt.start_time), day))
                    .map((appointment) => (
                      <div 
                        key={appointment.id} 
                        className="text-xs p-1 bg-primary-foreground border rounded mb-1"
                      >
                        <div className="font-medium">
                          {format(new Date(appointment.start_time), "HH:mm")}
                        </div>
                        <div>{appointment.clients?.name}</div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de edição */}
        <AppointmentModal
          open={!!editAppointment}
          onOpenChange={() => setEditAppointment(null)}
          appointment={editAppointment}
          onSuccess={fetchAppointments}
          selectedDate={date}
        />
      </div>
    );
  }

  // Visualização mensal (simplificada)
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Agendamentos do Mês</h2>
      
      {loading ? (
        <div className="flex justify-center p-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onEdit={() => setEditAppointment(appointment)}
                onDelete={() => handleDelete(appointment.id)}
                showDate
              />
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              Nenhum agendamento encontrado neste mês
            </div>
          )}
        </div>
      )}

      {/* Modal de edição */}
      <AppointmentModal
        open={!!editAppointment}
        onOpenChange={() => setEditAppointment(null)}
        appointment={editAppointment}
        onSuccess={fetchAppointments}
        selectedDate={date}
      />
    </div>
  );
};

// Componente de cartão de agendamento
interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: () => void;
  onDelete: () => void;
  showDate?: boolean;
}

const AppointmentCard = ({ appointment, onEdit, onDelete, showDate = false }: AppointmentCardProps) => {
  const startTime = new Date(appointment.start_time);
  const endTime = new Date(appointment.end_time);
  
  const getStatusColor = () => {
    // Map database status to UI color
    switch (appointment.status) {
      case "scheduled":
        return "border-blue-500 bg-blue-50";
      case "completed":
        return "border-green-500 bg-green-50";
      case "cancelled":
        return "border-red-500 bg-red-50";
      default:
        return "border-gray-300";
    }
  };

  // Translate status for display
  const getDisplayStatus = (dbStatus: string) => {
    switch (dbStatus) {
      case "scheduled": return "Agendado";
      case "cancelled": return "Cancelado";
      case "completed": return "Finalizado";
      default: return dbStatus;
    }
  };

  return (
    <div className={`mb-2 p-3 border-l-4 rounded-md shadow-sm ${getStatusColor()}`}>
      <div className="flex justify-between">
        <div>
          <p className="font-medium">{appointment.clients?.name}</p>
          <div className="text-sm text-gray-600">
            {showDate && (
              <span className="mr-2">
                {format(startTime, "dd/MM")}
              </span>
            )}
            <span>
              {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {appointment.appointment_services?.map((as) => as.services.name).join(", ")}
          </div>
          <div className="text-xs font-medium mt-1">
            Status: {getDisplayStatus(appointment.status)}
            {appointment.payment_status && (
              <span className="ml-2">
                Pagamento: {appointment.payment_status === "paid" ? "Pago" : "Pendente"}
              </span>
            )}
          </div>
        </div>
        <div className="flex space-x-1">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentList;
