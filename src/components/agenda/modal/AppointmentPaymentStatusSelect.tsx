
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { i18n } from "@/lib/i18n";

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
              value={field.value || "null"}
              onChange={(e) => {
                // Handle null as a string but convert it to actual null
                const value = e.target.value === "null" ? null : e.target.value;
                field.onChange(value);
              }}
            >
              <option value="null">
                {i18n.paymentStatus.null}
              </option>
              <option value="pending">
                {i18n.paymentStatus.pending}
              </option>
              <option value="paid">
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
