
import { useEffect } from "react";
import { AppointmentStepProps } from "../AppointmentWizard";
import { Checkbox } from "@/components/ui/checkbox";
import { calculateTotalPrice } from "../AgendaUtils";

const AppointmentServicesStep = ({
  formValues,
  updateFormValues,
  services,
  loadingServices
}: AppointmentStepProps) => {
  // Calculate total duration and price when services change
  const selectedServices = services.filter(service => 
    formValues.serviceIds.includes(service.id)
  );
  
  const totalDuration = selectedServices.reduce(
    (total, service) => total + (service.duration || 30),
    0
  );
  
  const totalPrice = calculateTotalPrice(selectedServices);
  
  // Helper function to format time in hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} min`;
    } else if (mins === 0) {
      return `${hours} h`;
    } else {
      return `${hours} h ${mins} min`;
    }
  };
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Selecione os Serviços</h3>
      
      {loadingServices ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
            {services.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Nenhum serviço cadastrado
              </div>
            ) : (
              services.map(service => (
                <div
                  key={service.id}
                  className={`p-3 rounded-md border transition-all ${
                    formValues.serviceIds.includes(service.id)
                      ? "border-primary bg-primary/10"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={formValues.serviceIds.includes(service.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFormValues({
                            serviceIds: [...formValues.serviceIds, service.id],
                          });
                        } else {
                          updateFormValues({
                            serviceIds: formValues.serviceIds.filter(id => id !== service.id),
                          });
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{service.name}</div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{formatDuration(service.duration)}</span>
                        <span>R$ {service.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Show summary of selected services */}
          {formValues.serviceIds.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="flex justify-between font-medium">
                <span>Total selecionado:</span>
                <span>{formValues.serviceIds.length} serviços</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Duração estimada:</span>
                <span>{formatDuration(totalDuration)}</span>
              </div>
              <div className="flex justify-between font-medium text-primary">
                <span>Valor total:</span>
                <span>R$ {totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AppointmentServicesStep;
