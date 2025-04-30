
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Database } from "@/integrations/supabase/types";

// Define the Client type directly from Database
type Client = Database["public"]["Tables"]["clients"]["Row"];

interface AppointmentClientSelectProps {
  clients: Client[];
  loadingClients: boolean;
  form: any;
}

const AppointmentClientSelect = ({ 
  clients, 
  loadingClients,
  form
}: AppointmentClientSelectProps) => {
  return (
    <FormField
      control={form.control}
      name="clientId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Cliente</FormLabel>
          <FormControl>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...field}
              disabled={loadingClients}
            >
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AppointmentClientSelect;
