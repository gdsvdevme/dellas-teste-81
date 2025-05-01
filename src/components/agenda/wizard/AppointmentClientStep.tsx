
import { useState } from "react";
import { AppointmentStepProps } from "../AppointmentWizard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import DialogNewClient from "../modal/DialogNewClient";

const AppointmentClientStep = ({
  formValues,
  updateFormValues,
  clients,
  loadingClients,
}: AppointmentStepProps) => {
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);

  // Função para lidar com a criação de novo cliente
  const handleClientCreated = (clientId: string, clientName: string) => {
    updateFormValues({ clientId });
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-playfair font-medium mb-4 text-salon-primary">Selecione o Cliente</h3>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Cliente</label>
          <div className="flex gap-2">
            <Select
              value={formValues.clientId}
              onValueChange={(value) => updateFormValues({ clientId: value })}
              disabled={loadingClients}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} {client.phone ? `(${client.phone})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setIsNewClientDialogOpen(true)}
            >
              Novo Cliente
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog para adicionar novo cliente */}
      <DialogNewClient
        open={isNewClientDialogOpen}
        onOpenChange={setIsNewClientDialogOpen}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
};

export default AppointmentClientStep;
