
import { Clock } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface AppointmentTimeSelectProps {
  form: any;
}

const AppointmentTimeSelect = ({ form }: AppointmentTimeSelectProps) => {
  return (
    <FormField
      control={form.control}
      name="startTime"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Horário</FormLabel>
          <FormControl>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 opacity-50" />
              <Input type="time" {...field} />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AppointmentTimeSelect;
