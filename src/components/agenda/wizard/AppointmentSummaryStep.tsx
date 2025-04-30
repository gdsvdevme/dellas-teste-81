
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentStepProps } from "../AppointmentWizard";
import { formatDuration } from "../AgendaUtils";

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
  
  // Calculate total price using custom prices
  const totalPrice = selectedServices.reduce((total, service) => {
    const customPrice = formValues.customPrices?.[service.id];
    return total + (customPrice !== undefined ? customPrice : service.price);
  }, 0);
  
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
          {selectedServices.map(service => {
            // Get custom price if available
            const servicePrice = formValues.customPrices?.[service.id] !== undefined
              ? formValues.customPrices[service.id]
              : service.price;
              
            return (
              <div key={service.id} className="flex justify-between">
                <div>
                  <div>{service.name}</div>
                  <div className="text-sm text-gray-500">{service.duration} min</div>
                </div>
                <div className="font-medium">
                  R$ {servicePrice.toFixed(2)}
                </div>
              </div>
            );
          })}
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
