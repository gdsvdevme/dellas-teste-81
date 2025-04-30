
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { AppointmentStepProps } from "../AppointmentWizard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AppointmentDateTimeStep = ({
  formValues,
  updateFormValues,
}: AppointmentStepProps) => {
  // Define recorrência options with labels
  const recurrenceOptions = [
    { value: "none", label: "Sem recorrência" },
    { value: "weekly", label: "Semanal" },
    { value: "biweekly", label: "Quinzenal" },
    { value: "monthly", label: "Mensal" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-4">Selecione Data e Hora</h3>
      
      {/* Date selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Data</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full pl-3 text-left font-normal",
                !formValues.date && "text-muted-foreground"
              )}
            >
              {formValues.date ? (
                format(formValues.date, "PPP", { locale: ptBR })
              ) : (
                <span>Selecione uma data</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formValues.date}
              onSelect={(date) => date && updateFormValues({ date })}
              initialFocus
              className="p-3 pointer-events-auto"
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Horário</label>
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 opacity-50" />
          <Input 
            type="time" 
            value={formValues.startTime}
            onChange={(e) => updateFormValues({ startTime: e.target.value })}
            className="flex-1"
          />
        </div>
      </div>

      {/* Recurrence selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Recorrência</label>
        <Select 
          value={formValues.recurrence || "none"}
          onValueChange={(value: any) => updateFormValues({ 
            recurrence: value === "none" ? null : value 
          })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a recorrência" />
          </SelectTrigger>
          <SelectContent>
            {recurrenceOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes field */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Observações</label>
        <textarea
          value={formValues.notes}
          onChange={(e) => updateFormValues({ notes: e.target.value })}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Adicione observações se necessário..."
        />
      </div>
    </div>
  );
};

export default AppointmentDateTimeStep;
