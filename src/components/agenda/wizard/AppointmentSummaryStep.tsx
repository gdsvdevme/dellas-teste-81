
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentStepProps } from "../AppointmentWizard";
import { formatDatePtBr } from "@/lib/date-utils";

const AppointmentSummaryStep = ({
  formValues,
  clients,
  services,
}: AppointmentStepProps) => {
  // Find client and selected services
  const client = clients.find((c) => c.id === formValues.clientId);
  const selectedServices = services.filter((s) =>
    formValues.serviceIds.includes(s.id)
  );

  // Calculate total price
  const totalPrice = selectedServices.reduce((total, service) => {
    const customPrice = formValues.customPrices[service.id];
    return total + (customPrice !== undefined ? customPrice : service.price);
  }, 0);

  // Format recurrence info
  const getRecurrenceText = () => {
    if (formValues.recurrence === "none" || !formValues.recurrence) {
      return "Sem recorrência";
    }

    const recurrenceTypeText = {
      weekly: "Semanal",
      biweekly: "Quinzenal",
      monthly: "Mensal",
    }[formValues.recurrence];

    const daysText =
      formValues.recurrenceDays && formValues.recurrenceDays.length > 0
        ? formValues.recurrenceDays
            .map((day) =>
              day.charAt(0).toUpperCase() + day.slice(1)
            )
            .join(", ")
        : "Nenhum dia selecionado";
    
    const countText = formValues.recurrenceCount > 1
      ? ` (${formValues.recurrenceCount} vezes)`
      : "";

    return `${recurrenceTypeText}${countText}: ${daysText}`;
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-playfair font-medium mb-4 text-salon-primary">
        Resumo do Agendamento
      </h3>

      <div className="border rounded-md p-4 space-y-4 bg-gray-50">
        {/* Client info */}
        <div>
          <h4 className="font-medium text-sm text-gray-500">Cliente</h4>
          <p className="font-medium">{client?.name || "Cliente não selecionado"}</p>
          <p className="text-sm">{client?.phone || "Telefone não informado"}</p>
        </div>

        {/* Services info */}
        <div>
          <h4 className="font-medium text-sm text-gray-500">Serviços</h4>
          <div className="space-y-2 mt-1">
            {selectedServices.map((service) => {
              const customPrice = formValues.customPrices[service.id];
              const displayPrice = customPrice !== undefined ? customPrice : service.price;
              
              return (
                <div key={service.id} className="flex justify-between">
                  <span>{service.name}</span>
                  <span className="font-medium">
                    R$ {displayPrice.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
            <span className="font-bold">Total</span>
            <span className="font-bold">
              R$ {totalPrice.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        {/* Date and time */}
        <div>
          <h4 className="font-medium text-sm text-gray-500">Data e Hora</h4>
          <p>
            {formatDatePtBr(formValues.date)} às{" "}
            {formValues.startTime}
          </p>
        </div>

        {/* Recurrence info */}
        <div>
          <h4 className="font-medium text-sm text-gray-500">Recorrência</h4>
          <p>{getRecurrenceText()}</p>
          {formValues.recurrence !== "none" && formValues.recurrence && formValues.recurrenceCount > 1 && (
            <p className="text-sm text-blue-600 mt-1">
              Este agendamento será repetido {formValues.recurrenceCount - 1} vezes conforme a configuração de recorrência.
            </p>
          )}
        </div>

        {/* Status info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-gray-500">Status</h4>
            <p>{formValues.status.charAt(0).toUpperCase() + formValues.status.slice(1)}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-500">Pagamento</h4>
            <p>{formValues.paymentStatus.charAt(0).toUpperCase() + formValues.paymentStatus.slice(1)}</p>
          </div>
        </div>

        {/* Notes */}
        {formValues.notes && (
          <div>
            <h4 className="font-medium text-sm text-gray-500">Observações</h4>
            <p className="whitespace-pre-wrap">{formValues.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentSummaryStep;
