
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { i18n } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const allowedPaymentStatus = [
  "pendente", 
  "pago"
] as const;

export type PaymentStatus = typeof allowedPaymentStatus[number] | "não definido";

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
            <Select
              value={field.value || "não definido"}
              onValueChange={(value) => {
                // Handle "não definido" as null in the form but as string in UI
                const paymentValue = value === "não definido" ? null : value as PaymentStatus;
                field.onChange(paymentValue);
                
                // Update appointment status based on payment status
                if (value === "pago") {
                  form.setValue("status", "finalizado");
                } else if (value === "pendente") {
                  form.setValue("status", "pagamento pendente");
                } else if (value === "não definido") {
                  // Only change status if current status is inconsistent
                  const currentStatus = form.getValues("status");
                  if (currentStatus === "finalizado" || currentStatus === "pagamento pendente") {
                    form.setValue("status", "agendado");
                  }
                }
              }}
            >
              <SelectTrigger className="rounded-md border-salon-secondary/50">
                <SelectValue placeholder="Selecione o status de pagamento" />
              </SelectTrigger>
              <SelectContent className="rounded-md border-salon-secondary/30">
                <SelectItem value="não definido">
                  Não definido
                </SelectItem>
                <SelectItem value="pendente">
                  {i18n.paymentStatus.pending}
                </SelectItem>
                <SelectItem value="pago">
                  {i18n.paymentStatus.paid}
                </SelectItem>
              </SelectContent>
            </Select>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default AppointmentPaymentStatusSelect;
