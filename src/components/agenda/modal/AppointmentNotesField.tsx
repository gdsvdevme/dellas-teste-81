
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";

interface AppointmentNotesFieldProps {
  form: any;
}

const AppointmentNotesField = ({ form }: AppointmentNotesFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Observações</FormLabel>
          <FormControl>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...field}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default AppointmentNotesField;
