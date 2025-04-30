
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Service } from "@/integrations/supabase/types";

interface AppointmentServiceSelectProps {
  services: Service[];
  form: any;
}

const AppointmentServiceSelect = ({ services, form }: AppointmentServiceSelectProps) => {
  return (
    <FormField
      control={form.control}
      name="serviceIds"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Serviços</FormLabel>
          <FormControl>
            <div className="space-y-2">
              {services.map((service) => (
                <label
                  key={service.id}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    value={service.id}
                    checked={field.value.includes(service.id)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const value = e.target.value;
                      if (checked) {
                        field.onChange([...field.value, value]);
                      } else {
                        field.onChange(
                          field.value.filter((v: string) => v !== value)
                        );
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>{service.name}</span>
                  <span className="text-sm text-gray-500">
                    ({service.duration} min - R$ {service.price.toFixed(2)})
                  </span>
                </label>
              ))}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AppointmentServiceSelect;
