
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentStepProps } from "../AppointmentWizard";
import { Badge } from "@/components/ui/badge";

const AppointmentSummaryStep = ({
  formValues,
  clients,
  services,
}: AppointmentStepProps) => {
  // Find client details
  const client = clients.find((c) => c.id === formValues.clientId);
  
  // Find selected services details
  const selectedServices = services.filter((s) => formValues.serviceIds.includes(s.id));
  
  // Calculate total price and duration
  const totalPrice = selectedServices.reduce((total, service) => {
    const customPrice = formValues.customPrices?.[service.id];
    return total + (customPrice !== undefined ? customPrice : service.price);
  }, 0);
  
  const totalDuration = selectedServices.reduce((total, service) => total + (service.duration || 60), 0);
  
  // Format duration as hours and minutes
  const durationHours = Math.floor(totalDuration / 60);
  const durationMinutes = totalDuration % 60;
  
  const formattedDuration = `${durationHours ? `${durationHours}h` : ""}${durationMinutes ? ` ${durationMinutes}min` : ""}`;

  // Get recurrence display info
  const getRecurrenceDisplay = () => {
    if (!formValues.recurrence || formValues.recurrence === "none") {
      return "Sem recorrência";
    }
    
    const recurrenceMap: Record<string, string> = {
      weekly: "Semanal",
      biweekly: "Quinzenal",
      monthly: "Mensal",
    };
    
    const recurrenceText = recurrenceMap[formValues.recurrence] || "";
    
    return (
      <div className="text-sm">
        <div><span className="font-medium">Recorrência:</span> {recurrenceText}</div>
        {formValues.recurrenceCount > 1 && (
          <div><span className="font-medium">Repetições:</span> {formValues.recurrenceCount}</div>
        )}
        {formValues.recurrenceDays && formValues.recurrenceDays.length > 0 && (
          <div>
            <span className="font-medium">Dias:</span> {formValues.recurrenceDays.join(", ")}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-playfair font-medium mb-4 text-salon-primary">Resumo do Agendamento</h3>
      
      <div className="space-y-4">
        {/* Cliente */}
        <div>
          <h4 className="text-sm font-semibold mb-1">Cliente</h4>
          <div className="border rounded-md p-3 bg-muted/30">
            <p className="text-lg">{client?.name || ""}</p>
            <p className="text-sm text-muted-foreground">{client?.phone || ""}</p>
          </div>
        </div>
        
        {/* Serviços */}
        <div>
          <h4 className="text-sm font-semibold mb-1">Serviços</h4>
          <div className="border rounded-md p-3 bg-muted/30">
            <ul className="space-y-2">
              {selectedServices.map((service) => {
                const customPrice = formValues.customPrices?.[service.id];
                const displayPrice = customPrice !== undefined ? customPrice : service.price;
                
                return (
                  <li key={service.id} className="flex justify-between items-center">
                    <div>
                      <span className="block">{service.name}</span>
                      <span className="text-xs text-muted-foreground">{service.duration} min</span>
                    </div>
                    <span className="font-medium">
                      R$ {displayPrice.toFixed(2).replace(".", ",")}
                    </span>
                  </li>
                );
              })}
              <li className="border-t pt-2 mt-2 flex justify-between items-center">
                <span className="font-medium">Total</span>
                <div className="text-right">
                  <div className="font-semibold">
                    R$ {totalPrice.toFixed(2).replace(".", ",")}
                  </div>
                  <div className="text-xs">
                    Duração: {formattedDuration}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Data e hora */}
        <div>
          <h4 className="text-sm font-semibold mb-1">Data e Hora</h4>
          <div className="border rounded-md p-3 bg-muted/30">
            <div className="flex justify-between items-center">
              <div>
                <p>{formValues.date ? format(formValues.date, "PPP", { locale: ptBR }) : ""}</p>
                <p className="text-sm text-muted-foreground">às {formValues.startTime}</p>
              </div>
              <Badge variant={formValues.recurrence && formValues.recurrence !== "none" ? "outline" : "secondary"}>
                {formValues.recurrence && formValues.recurrence !== "none" ? "Recorrente" : "Único"}
              </Badge>
            </div>
            
            {formValues.recurrence && formValues.recurrence !== "none" && (
              <div className="mt-2 pt-2 border-t">
                {getRecurrenceDisplay()}
              </div>
            )}
          </div>
        </div>
        
        {/* Observações */}
        {formValues.notes && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Observações</h4>
            <div className="border rounded-md p-3 bg-muted/30">
              <p className="text-sm">{formValues.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentSummaryStep;
