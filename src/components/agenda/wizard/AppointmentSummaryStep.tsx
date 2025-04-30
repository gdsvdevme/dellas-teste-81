
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentStepProps } from "../AppointmentWizard";
import { calculateTotalPrice } from "../AgendaUtils";

const AppointmentSummaryStep = ({
  formValues,
  clients,
  services,
}: AppointmentStepProps) => {
  // Get client and selected services
  const client = clients.find(c => c.id === formValues.clientId);
  const selectedServices = services.filter(service => 
    formValues.serviceIds.includes(service.id)
  );
  
  // Calculate total duration and price
  const totalDuration = selectedServices.reduce(
    (total, service) => total + (service.duration || 30),
    0
  );
  
  const totalPrice = calculateTotalPrice(selectedServices);
  
  // Format total duration in hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} minutos`;
    } else if (mins === 0) {
      return `${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hora${hours > 1 ? 's' : ''} e ${mins} minutos`;
    }
  };
  
  // Get recurrence label
  const getRecurrenceLabel = () => {
    switch (formValues.recurrence) {
      case "weekly": return "Semanal";
      case "biweekly": return "Quinzenal";
      case "monthly": return "Mensal";
      default: return "Sem recorrência";
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">Resumo do Agendamento</h3>
      
      {/* Client info */}
      <div className="border-b pb-4">
        <h4 className="text-sm font-medium text-gray-500">CLIENTE</h4>
        <div className="font-medium">{client?.name}</div>
        {client?.phone && <div className="text-sm">{client.phone}</div>}
      </div>
      
      {/* Services info */}
      <div className="border-b pb-4">
        <h4 className="text-sm font-medium text-gray-500">SERVIÇOS</h4>
        <div className="space-y-2 mt-1">
          {selectedServices.map(service => (
            <div key={service.id} className="flex justify-between">
              <div>
                <div>{service.name}</div>
                <div className="text-sm text-gray-500">{service.duration} min</div>
              </div>
              <div className="font-medium">
                R$ {service.price.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t flex justify-between font-medium">
          <div>Total</div>
          <div className="text-primary">R$ {totalPrice.toFixed(2)}</div>
        </div>
      </div>
      
      {/* Date and time info */}
      <div className="border-b pb-4">
        <h4 className="text-sm font-medium text-gray-500">DATA E HORA</h4>
        <div className="font-medium">
          {format(formValues.date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
        <div>Horário: {formValues.startTime}</div>
        <div>Duração estimada: {formatDuration(totalDuration)}</div>
      </div>
      
      {/* Recurrence info */}
      <div>
        <h4 className="text-sm font-medium text-gray-500">RECORRÊNCIA</h4>
        <div className="font-medium">{getRecurrenceLabel()}</div>
      </div>
      
      {/* Notes if any */}
      {formValues.notes && (
        <div>
          <h4 className="text-sm font-medium text-gray-500">OBSERVAÇÕES</h4>
          <div className="text-sm bg-gray-50 p-2 rounded">{formValues.notes}</div>
        </div>
      )}
    </div>
  );
};

export default AppointmentSummaryStep;
