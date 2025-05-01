
import { useState, useEffect } from "react";
import { AppointmentStepProps } from "../AppointmentWizard";
import { Button } from "@/components/ui/button";
import DialogNewClient from "../modal/DialogNewClient";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const AppointmentClientStep = ({
  formValues,
  updateFormValues,
  clients,
  loadingClients,
}: AppointmentStepProps) => {
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Function to handle client creation
  const handleClientCreated = (clientId: string, clientName: string) => {
    updateFormValues({ clientId });
    setOpen(false);
  };

  // Get the selected client name for display
  const selectedClient = clients.find(client => client.id === formValues.clientId);

  // Filter clients based on search query
  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) || 
      (client.phone && client.phone.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-playfair font-medium mb-4 text-salon-primary">Selecione o Cliente</h3>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Cliente</label>
          <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  disabled={loadingClients}
                >
                  {selectedClient ? selectedClient.name : "Selecione um cliente"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-full min-w-[300px]" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Buscar cliente..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup heading="Clientes">
                      {filteredClients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.id}
                          onSelect={() => {
                            updateFormValues({ clientId: client.id });
                            setOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center justify-between py-3"
                        >
                          <div>
                            <div className="font-medium">{client.name}</div>
                            {client.phone && (
                              <div className="text-sm text-muted-foreground">{client.phone}</div>
                            )}
                          </div>
                          
                          {formValues.clientId === client.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setIsNewClientDialogOpen(true)}
              className="flex items-center whitespace-nowrap"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog for adding new client */}
      <DialogNewClient
        open={isNewClientDialogOpen}
        onOpenChange={setIsNewClientDialogOpen}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
};

export default AppointmentClientStep;
