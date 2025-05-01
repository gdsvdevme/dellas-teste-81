
import { useEffect } from "react";
import { AppointmentStepProps } from "../AppointmentWizard";
import { Checkbox } from "@/components/ui/checkbox";
import { calculateTotalPrice } from "../AgendaUtils";
import { Input } from "@/components/ui/input";

const AppointmentServicesStep = ({
  formValues,
  updateFormValues,
  services,
  loadingServices
}: AppointmentStepProps) => {
  // Calculate total price based on selected services and custom prices
  const selectedServices = services.filter(service => 
    formValues.serviceIds.includes(service.id)
  );
  
  // Use custom prices if available, otherwise use service default price
  const calculateTotal = () => {
    return selectedServices.reduce((total, service) => {
      const customPrice = formValues.customPrices?.[service.id];
      return total + (customPrice !== undefined ? customPrice : service.price);
    }, 0);
  };
  
  const totalPrice = calculateTotal();
  
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
              services.map(service => {
                // Check if service is selected
                const isSelected = formValues.serviceIds.includes(service.id);
                
                // Get the price (custom or default)
                const servicePrice = formValues.customPrices?.[service.id] !== undefined
                  ? formValues.customPrices[service.id]
                  : service.price;
                
                return (
                  <div
                    key={service.id}
                    className={`p-3 rounded-md border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Add service to selected services
                              updateFormValues({
                                serviceIds: [...formValues.serviceIds, service.id],
                                customPrices: {
                                  ...formValues.customPrices,
                                  [service.id]: service.price // Initialize with default price
                                }
                              });
                            } else {
                              // Remove service from selected services
                              const newCustomPrices = {...formValues.customPrices};
                              delete newCustomPrices[service.id];
                              
                              updateFormValues({
                                serviceIds: formValues.serviceIds.filter(id => id !== service.id),
                                customPrices: newCustomPrices
                              });
                            }
                          }}
                        />
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {/* Duration removed as requested */}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">R$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={servicePrice}
                            onChange={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0;
                              updateFormValues({
                                customPrices: {
                                  ...formValues.customPrices,
                                  [service.id]: newPrice
                                }
                              });
                            }}
                            className="w-20 text-right"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Show summary of selected services */}
          {formValues.serviceIds.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="flex justify-between font-medium">
                <span>Total selecionado:</span>
                <span>{formValues.serviceIds.length} serviços</span>
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
