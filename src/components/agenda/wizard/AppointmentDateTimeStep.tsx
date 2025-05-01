
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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

  // Define weekdays for selection
  const weekdays = [
    { value: "domingo", label: "D" },
    { value: "segunda", label: "S" },
    { value: "terca", label: "T" },
    { value: "quarta", label: "Q" },
    { value: "quinta", label: "Q" },
    { value: "sexta", label: "S" },
    { value: "sabado", label: "S" },
  ];

  // Toggle a day in the recurrenceDays array
  const handleDayToggle = (day: string) => {
    updateFormValues({
      recurrenceDays: formValues.recurrenceDays?.includes(day)
        ? formValues.recurrenceDays.filter(d => d !== day)
        : [...(formValues.recurrenceDays || []), day]
    });
  };

  // Check if recurrence is enabled (not "none")
  const isRecurrenceEnabled = formValues.recurrence && formValues.recurrence !== "none";

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-playfair font-medium mb-4 text-salon-primary">Selecione Data e Hora</h3>
      
      {/* Date selection */}
      <div className="space-y-2.5">
        <label className="block text-sm font-medium">Data</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full pl-3 text-left font-normal border-salon-secondary/50 rounded-md",
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
          <PopoverContent className="w-auto p-0 rounded-md border-salon-secondary/30" align="start">
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
      <div className="space-y-2.5">
        <label className="block text-sm font-medium">Horário</label>
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-salon-primary" />
          <Input 
            type="time" 
            value={formValues.startTime}
            onChange={(e) => updateFormValues({ startTime: e.target.value })}
            className="flex-1 rounded-md border-salon-secondary/50"
          />
        </div>
      </div>

      {/* Recurrence selection */}
      <div className="space-y-2.5">
        <label className="block text-sm font-medium">Recorrência</label>
        <Select 
          value={formValues.recurrence || "none"}
          onValueChange={(value: any) => updateFormValues({ 
            recurrence: value === "none" ? null : value,
            recurrenceDays: value === "none" ? [] : formValues.recurrenceDays
          })}
        >
          <SelectTrigger className="border-salon-secondary/50 rounded-md focus:ring-salon-primary">
            <SelectValue placeholder="Selecione a recorrência" />
          </SelectTrigger>
          <SelectContent className="rounded-md border-salon-secondary/30">
            {recurrenceOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Weekday selection - only show when recurrence is enabled */}
      {isRecurrenceEnabled && (
        <div className="space-y-2.5">
          <label className="block text-sm font-medium">Dias da semana</label>
          <ToggleGroup type="multiple" className="justify-start flex flex-wrap gap-1">
            {weekdays.map((day) => {
              const isSelected = formValues.recurrenceDays?.includes(day.value);
              return (
                <ToggleGroupItem
                  key={day.value}
                  value={day.value}
                  aria-label={day.value}
                  className={cn(
                    "w-8 h-8 rounded-full",
                    isSelected ? "bg-salon-primary text-white" : ""
                  )}
                  onClick={() => handleDayToggle(day.value)}
                >
                  {day.label}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
          <p className="text-xs text-muted-foreground mt-1">
            {formValues.recurrenceDays?.length 
              ? "Dias selecionados: " + formValues.recurrenceDays.length 
              : "Selecione pelo menos um dia da semana"}
          </p>
        </div>
      )}

      {/* Notes field */}
      <div className="space-y-2.5">
        <label className="block text-sm font-medium">Observações</label>
        <textarea
          value={formValues.notes}
          onChange={(e) => updateFormValues({ notes: e.target.value })}
          className="flex min-h-[80px] w-full rounded-md border border-salon-secondary/50 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salon-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Adicione observações se necessário..."
        />
      </div>
    </div>
  );
};

export default AppointmentDateTimeStep;
