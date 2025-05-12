
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Database } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

// Define the Service type based on the Database type
type Service = Database["public"]["Tables"]["services"]["Row"];

interface AppointmentServiceSelectProps {
  services: Service[];
  form: any;
}

const AppointmentServiceSelect = ({ services, form }: AppointmentServiceSelectProps) => {
  // Custom prices state
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const isMobile = useIsMobile();

  return (
    <FormField
      control={form.control}
      name="serviceIds"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Serviços</FormLabel>
          <FormControl>
            <ScrollArea className={`rounded-md border ${isMobile ? 'h-[30vh]' : 'h-[35vh]'}`}>
              <div className="space-y-2 p-3">
                {services.map((service) => {
                  const isSelected = field.value.includes(service.id);
                  
                  // Get current service price (custom or default)
                  const currentPrice = customPrices[service.id] !== undefined 
                    ? customPrices[service.id] 
                    : service.price;

                  return (
                    <div
                      key={service.id}
                      className={`p-3 rounded-md border transition-all ${
                        isSelected ? "border-primary bg-primary/5" : "border-gray-200"
                      }`}
                    >
                      <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-start'}`}>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            value={service.id}
                            checked={isSelected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const value = e.target.value;
                              
                              if (checked) {
                                field.onChange([...field.value, value]);
                                
                                // Update form value with service custom price data
                                const currentCustomPrices = form.getValues("customPrices") || {};
                                form.setValue("customPrices", {
                                  ...currentCustomPrices,
                                  [service.id]: currentPrice
                                });
                              } else {
                                field.onChange(
                                  field.value.filter((v: string) => v !== value)
                                );
                                
                                // Remove price from custom prices when service is deselected
                                const currentCustomPrices = {...form.getValues("customPrices")};
                                delete currentCustomPrices[service.id];
                                form.setValue("customPrices", currentCustomPrices);
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <div className="flex-1">
                            <span className="font-medium">{service.name}</span>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className={`${isMobile ? 'mt-2 ml-7' : 'ml-auto'} flex items-center space-x-2`}>
                            <span className="text-sm">R$</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={currentPrice}
                              onChange={(e) => {
                                const newPrice = parseFloat(e.target.value);
                                
                                // Update local state
                                setCustomPrices(prev => ({
                                  ...prev,
                                  [service.id]: newPrice
                                }));
                                
                                // Update form data
                                const currentCustomPrices = form.getValues("customPrices") || {};
                                form.setValue("customPrices", {
                                  ...currentCustomPrices,
                                  [service.id]: newPrice
                                });
                              }}
                              className="w-24 text-right"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {services.length === 0 && (
                  <div className="text-center p-4 text-gray-500">
                    Nenhum serviço encontrado
                  </div>
                )}
              </div>
            </ScrollArea>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AppointmentServiceSelect;
