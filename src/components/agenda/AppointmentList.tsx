
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
import { Edit, Trash } from "lucide-react";
import AppointmentModal from "./AppointmentModal";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/ui/status-badge";
import { appointmentStatusMap, getDisplayStatus } from "./AgendaUtils";
import AppointmentDetails from "./AppointmentDetails";

// Updated Appointment type to use final_price instead of price
type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  clients: { name: string } | null;
  appointment_services: Array<{
    service_id: string;
    final_price: number;
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
  const [detailsAppointment, setDetailsAppointment] = useState<Appointment | null>(null);
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
            final_price,
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

    // Filter hours that have appointments
    const hoursWithAppointments = hours.filter(hour => {
      return appointments.some(apt => {
        const aptDate = new Date(apt.start_time);
        return aptDate.getHours() === hour.getHours();
      });
    });

    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Agendamentos do Dia</h2>
        
        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {hoursWithAppointments.length > 0 ? (
              <div className="space-y-1">
                {hoursWithAppointments.map((hour) => {
                  const hourAppointments = appointments.filter((apt) => {
                    const aptDate = new Date(apt.start_time);
                    return aptDate.getHours() === hour.getHours();
                  });

                  return (
                    <div key={hour.toString()} className="border-t py-2">
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        {format(hour, "HH:mm")}
                      </div>
                      
                      <div className="space-y-2">
                        {hourAppointments.map((appointment) => (
                          <AppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            onClick={() => setDetailsAppointment(appointment)}
                            variant="day"
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                Nenhum agendamento encontrado neste dia
              </div>
            )}
          </>
        )}

        <AppointmentDetails
          open={!!detailsAppointment}
          onOpenChange={() => setDetailsAppointment(null)}
          appointment={detailsAppointment}
          onSuccess={fetchAppointments}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2">
            {days.map((day) => {
              const dayAppointments = appointments.filter((apt) => 
                isSameDay(new Date(apt.start_time), day)
              );
              
              return (
                <div key={day.toString()} className="border rounded-md p-2 bg-white">
                  <div className="text-center font-medium mb-2 sticky top-0 bg-white pb-1 border-b">
                    <div className="text-xs uppercase tracking-wide text-gray-500">
                      {format(day, "EEE", { locale: ptBR })}
                    </div>
                    <div className="text-lg">{format(day, "dd", { locale: ptBR })}</div>
                  </div>

                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {dayAppointments.length > 0 ? (
                      dayAppointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onClick={() => setDetailsAppointment(appointment)}
                          variant="week"
                        />
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 text-center py-2">
                        Sem agendamentos
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <AppointmentDetails
          open={!!detailsAppointment}
          onOpenChange={() => setDetailsAppointment(null)}
          appointment={detailsAppointment}
          onSuccess={fetchAppointments}
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
                onClick={() => setDetailsAppointment(appointment)}
                variant="month"
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

      <AppointmentDetails
        open={!!detailsAppointment}
        onOpenChange={() => setDetailsAppointment(null)}
        appointment={detailsAppointment}
        onSuccess={fetchAppointments}
      />
    </div>
  );
};

// Componente de cartão de agendamento
interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
  variant: "day" | "week" | "month";
  showDate?: boolean;
}

const AppointmentCard = ({ appointment, onClick, variant, showDate = false }: AppointmentCardProps) => {
  const startTime = new Date(appointment.start_time);
  
  // Get proper status with translation from DB values
  const displayStatus = getDisplayStatus(appointment.status);
  const statusConfig = appointmentStatusMap[displayStatus];
  const StatusIcon = statusConfig?.icon;

  return (
    <div 
      className={`p-2 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 transition-colors ${statusConfig?.color || ""}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {variant !== "week" && (
            <div className="font-medium mb-0.5 line-clamp-1">{appointment.clients?.name}</div>
          )}
          
          <div className="text-sm text-gray-600">
            {showDate && (
              <span className="mr-2">
                {format(startTime, "dd/MM")}
              </span>
            )}
            <span>
              {format(startTime, "HH:mm")}
            </span>
          </div>
          
          {variant === "week" && (
            <div className="text-sm font-medium line-clamp-1 mt-1">
              {appointment.clients?.name}
            </div>
          )}
          
          {variant === "day" && appointment.appointment_services && appointment.appointment_services.length > 0 && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
              {appointment.appointment_services.map(as => as.services.name).join(", ")}
            </div>
          )}
          
          <div className="mt-1">
            <StatusBadge 
              variant={statusConfig?.badgeVariant || "default"} 
              className="flex items-center gap-1 text-xs"
            >
              {StatusIcon && <StatusIcon className="h-3 w-3" />}
              <span className="line-clamp-1">{statusConfig?.label}</span>
            </StatusBadge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentList;
