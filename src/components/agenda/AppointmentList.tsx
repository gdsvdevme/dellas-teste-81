
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
  isSameDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { appointmentStatusMap, getDisplayStatus } from "./AgendaUtils";
import AppointmentDetails from "./AppointmentDetails";
import { useToast } from "@/hooks/use-toast";
import { Repeat } from "lucide-react";
import { removeDiacritics } from "@/lib/utils";

// Updated Appointment type to use final_price instead of price and include parent-child fields
type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  clients: { name: string } | null;
  appointment_services: Array<{
    service_id: string;
    final_price: number;
    services: { name: string; duration: number };
  }> | null;
  is_parent: boolean;
  parent_appointment_id: string | null;
};

// Helper function to check if an appointment is part of a recurrence
const isRecurringAppointment = (appointment: Appointment): boolean => {
  // An appointment is recurring if:
  // 1. It has recurrence settings and is a parent
  // 2. Or it has a parent_appointment_id
  return (!!appointment.recurrence && 
         appointment.recurrence !== 'none' && 
         appointment.is_parent) ||
         !!appointment.parent_appointment_id;
};

interface AppointmentListProps {
  date: Date;
  view: "day" | "week" | "month";
  searchTerm?: string;
}

const AppointmentList = ({ date, view, searchTerm = "" }: AppointmentListProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
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
        // Cast returned data to the Appointment type to handle the additional fields
        setAppointments(data as unknown as Appointment[]);
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter appointments based on search term
  const filterAppointmentsBySearch = (appointments: Appointment[]): Appointment[] => {
    if (!searchTerm || searchTerm.trim() === "") {
      return appointments;
    }

    const normalizedSearchTerm = removeDiacritics(searchTerm.toLowerCase());
    
    return appointments.filter((appointment) => {
      const clientName = appointment.clients?.name || "";
      const normalizedClientName = removeDiacritics(clientName.toLowerCase());
      
      // Services are in an array, so we need to join them
      const serviceNames = appointment.appointment_services?.map(s => s.services?.name || "") || [];
      const serviceString = removeDiacritics(serviceNames.join(" ").toLowerCase());
      
      return normalizedClientName.includes(normalizedSearchTerm) || 
             serviceString.includes(normalizedSearchTerm);
    });
  };

  // Renderização baseada na visualização selecionada
  if (view === "day") {
    // Filter appointments for the selected day and sort by start time
    const dayAppointments = filterAppointmentsBySearch(
      appointments
        .filter(apt => isSameDay(new Date(apt.start_time), date))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    );

    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Agendamentos do Dia</h2>
        
        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {dayAppointments.length > 0 ? (
              <div className="space-y-2">
                {dayAppointments.map((appointment) => (
                  <div key={appointment.id} className="border-t py-2">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      {format(new Date(appointment.start_time), "HH:mm")}
                    </div>
                    
                    <AppointmentCard
                      appointment={appointment}
                      onClick={() => setDetailsAppointment(appointment)}
                      variant="day"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                {searchTerm ? "Nenhum agendamento encontrado com esse filtro" : "Nenhum agendamento encontrado neste dia"}
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
    
    // Array dos nomes dos dias da semana em português
    const weekdayNames = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

    // Filter appointments based on search term
    const filteredAppointments = filterAppointmentsBySearch(appointments);

    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Agendamentos da Semana</h2>
        
        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-0.5 border rounded-md overflow-hidden">
            {/* Cabeçalhos dos dias da semana */}
            {days.map((day, index) => (
              <div key={`header-${day.toString()}`} className="bg-gray-50 py-2 text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {weekdayNames[day.getDay()]}
                </div>
                <div className="text-lg font-medium">
                  {format(day, "dd")}
                </div>
              </div>
            ))}
            
            {/* Células dos dias com agendamentos */}
            {days.map((day) => {
              const dayAppointments = filteredAppointments.filter((apt) => 
                isSameDay(new Date(apt.start_time), day)
              ).sort((a, b) => 
                new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
              );
              
              return (
                <div key={`cell-${day.toString()}`} className="min-h-[200px] max-h-[300px] overflow-y-auto border-r border-t p-0.5">
                  <div className="space-y-0.5">
                    {dayAppointments.length > 0 ? (
                      dayAppointments.map((appointment) => (
                        <AppointmentCardCompact
                          key={appointment.id}
                          appointment={appointment}
                          onClick={() => setDetailsAppointment(appointment)}
                        />
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-xs text-gray-300">-</div>
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
  const filteredMonthAppointments = filterAppointmentsBySearch(appointments);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Agendamentos do Mês</h2>
      
      {loading ? (
        <div className="flex justify-center p-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMonthAppointments.length > 0 ? (
            filteredMonthAppointments.map((appointment) => (
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
              {searchTerm ? "Nenhum agendamento encontrado com esse filtro" : "Nenhum agendamento encontrado neste mês"}
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
  
  // Check if this is a recurring appointment
  const isRecurring = isRecurringAppointment(appointment);
  const isParent = appointment.is_parent;
  const hasParent = !!appointment.parent_appointment_id;

  return (
    <div 
      className={`p-2 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 transition-colors ${statusConfig?.color || ""}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {variant !== "week" && (
            <div className="font-medium mb-0.5 line-clamp-1 flex items-center gap-1">
              {appointment.clients?.name}
              {isRecurring && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  <Repeat className="h-3 w-3 mr-1" />
                  {isParent ? "Principal" : "Recorrente"}
                </span>
              )}
            </div>
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
            <div className="text-sm font-medium line-clamp-1 mt-1 flex items-center gap-1">
              {appointment.clients?.name}
              {isRecurring && (
                <Repeat className="h-3 w-3 text-blue-500" />
              )}
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

// Novo componente de cartão de agendamento mais compacto para visualização semanal
const AppointmentCardCompact = ({ appointment, onClick }: { appointment: Appointment; onClick: () => void }) => {
  const startTime = new Date(appointment.start_time);
  const displayStatus = getDisplayStatus(appointment.status);
  const statusConfig = appointmentStatusMap[displayStatus];
  const StatusIcon = statusConfig?.icon;
  
  // Check if this is a recurring appointment
  const isRecurring = isRecurringAppointment(appointment);
  const isParent = appointment.is_parent;

  // Determine a cor de borda baseada no status
  const statusBorderClass = {
    agendado: "border-l-blue-500",
    cancelado: "border-l-red-500",
    finalizado: "border-l-green-500",
    "pagamento pendente": "border-l-yellow-500"
  }[displayStatus] || "border-l-gray-300";

  return (
    <div
      onClick={onClick}
      className={`border-l-2 ${statusBorderClass} bg-white rounded-sm p-1 cursor-pointer hover:bg-gray-50 transition-colors text-xs`}
    >
      <div className="font-semibold flex items-center">
        {format(startTime, "HH:mm")}
        {isRecurring && (
          <Repeat className="h-2.5 w-2.5 ml-1 text-blue-500" />
        )}
      </div>
      <div className="font-medium line-clamp-1">
        {appointment.clients?.name}
      </div>
      <div className="flex items-center mt-0.5">
        {StatusIcon && <StatusIcon className={`h-2.5 w-2.5 mr-1 ${statusConfig?.badgeVariant === 'success' ? 'text-green-600' : statusConfig?.badgeVariant === 'danger' ? 'text-red-600' : statusConfig?.badgeVariant === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`} />}
      </div>
    </div>
  );
};

export default AppointmentList;
