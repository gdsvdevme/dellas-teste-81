
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { i18n } from "@/lib/i18n";

export const allowedPaymentStatus = [
  "pendente", 
  "pago"
] as const;

export type PaymentStatus = typeof allowedPaymentStatus[number] | null;

interface AppointmentPaymentStatusSelectProps {
  form: any;
}

const AppointmentPaymentStatusSelect = ({ form }: AppointmentPaymentStatusSelectProps) => {
  return (
    <FormField
      control={form.control}
      name="paymentStatus"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Pagamento</FormLabel>
          <FormControl>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...field}
              value={field.value || "não definido"}
              onChange={(e) => {
                // Handle "não definido" as a string but convert it to actual null
                const value = e.target.value === "não definido" ? null : e.target.value as PaymentStatus;
                field.onChange(value);
                
                // Update appointment status based on payment status
                if (value === "pago") {
                  form.setValue("status", "finalizado");
                } else if (value === "pendente") {
                  form.setValue("status", "pagamento pendente");
                } else if (value === null) {
                  // Only change status if current status is inconsistent
                  const currentStatus = form.getValues("status");
                  if (currentStatus === "finalizado" || currentStatus === "pagamento pendente") {
                    form.setValue("status", "agendado");
                  }
                }
              }}
            >
              <option value="não definido">
                Não definido
              </option>
              <option value="pendente">
                {i18n.paymentStatus.pending}
              </option>
              <option value="pago">
                {i18n.paymentStatus.paid}
              </option>
            </select>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default AppointmentPaymentStatusSelect;
