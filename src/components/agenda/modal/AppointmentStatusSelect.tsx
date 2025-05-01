
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { i18n } from "@/lib/i18n";

interface AppointmentStatusSelectProps {
  form: any;
}

const AppointmentStatusSelect = ({ form }: AppointmentStatusSelectProps) => {
  return (
    <FormField
      control={form.control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Status</FormLabel>
          <FormControl>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...field}
            >
              <option value="agendado">
                {i18n.appointmentStatus.scheduled}
              </option>
              <option value="cancelado">
                {i18n.appointmentStatus.cancelled}
              </option>
              <option value="finalizado">
                {i18n.appointmentStatus.completed}
              </option>
            </select>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default AppointmentStatusSelect;
