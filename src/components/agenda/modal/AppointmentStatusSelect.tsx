
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { i18n } from "@/lib/i18n";
import { appointmentStatusMap } from "../AgendaUtils";

export const allowedAppointmentStatus = [
  "agendado", 
  "cancelado", 
  "finalizado", 
  "pagamento pendente"
] as const;

export type AppointmentStatus = typeof allowedAppointmentStatus[number];

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
              onChange={(e) => {
                // When status changes, update payment status consistently
                const newStatus = e.target.value as AppointmentStatus;
                field.onChange(newStatus);
                
                // Update payment status based on the new appointment status
                if (newStatus === "cancelado" || newStatus === "agendado") {
                  form.setValue("paymentStatus", "não definido");
                } else if (newStatus === "finalizado") {
                  form.setValue("paymentStatus", "pago");
                } else if (newStatus === "pagamento pendente") {
                  form.setValue("paymentStatus", "pendente");
                }
              }}
            >
              {allowedAppointmentStatus.map((status) => (
                <option key={status} value={status}>
                  {appointmentStatusMap[status]?.label || status}
                </option>
              ))}
            </select>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default AppointmentStatusSelect;
