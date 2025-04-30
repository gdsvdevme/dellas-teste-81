
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { i18n } from "@/lib/i18n";
import AppointmentList from "@/components/agenda/AppointmentList";
import AppointmentWizard from "@/components/agenda/AppointmentWizard";

const Agenda = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [isAppointmentWizardOpen, setIsAppointmentWizardOpen] = useState(false);

  // Format the date according to the current view
  const getFormattedDate = () => {
    if (view === "day") {
      return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } else if (view === "week") {
      return `Semana de ${format(date, "dd 'de' MMMM", { locale: ptBR })}`;
    } else {
      return format(date, "MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  return (
    <PageContainer>
      <PageHeader title={i18n.common.agenda} subtitle={getFormattedDate()}>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAppointmentWizardOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendário lateral */}
        <div className="md:col-span-1 bg-white p-4 rounded-lg shadow">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Calendário</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDate(new Date())}
            >
              <CalendarIcon className="mr-2 h-4 w-4" /> Hoje
            </Button>
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => date && setDate(date)}
            className="p-3 rounded-md border"
            locale={ptBR}
          />
          
          {/* Botões de visualização */}
          <div className="mt-4 flex items-center gap-2">
            <Button 
              variant={view === "day" ? "default" : "outline"} 
              size="sm"
              onClick={() => setView("day")}
            >
              Diário
            </Button>
            <Button 
              variant={view === "week" ? "default" : "outline"} 
              size="sm"
              onClick={() => setView("week")}
            >
              Semanal
            </Button>
            <Button 
              variant={view === "month" ? "default" : "outline"} 
              size="sm"
              onClick={() => setView("month")}
            >
              Mensal
            </Button>
          </div>
        </div>

        {/* Lista de Agendamentos */}
        <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
          <AppointmentList 
            date={date} 
            view={view}
          />
        </div>
      </div>

      {/* Wizard de criação de agendamento */}
      <AppointmentWizard
        open={isAppointmentWizardOpen}
        onClose={() => setIsAppointmentWizardOpen(false)}
        onSuccess={() => {
          // Refresh appointment list
          window.location.reload();
        }}
        selectedDate={date}
      />
    </PageContainer>
  );
};

export default Agenda;
