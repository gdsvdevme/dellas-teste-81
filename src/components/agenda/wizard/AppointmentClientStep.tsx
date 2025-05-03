
import { useState } from "react";
import { Check, Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppointmentStepProps } from "../AppointmentWizard";
import ClientDialogQuick from "@/components/clients/ClientDialogQuick";
import { removeDiacritics } from "@/lib/utils";

const AppointmentClientStep = ({
  formValues,
  updateFormValues,
  clients,
  loadingClients
}: AppointmentStepProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  
  // Filter clients based on search term with accent-insensitive comparison
  const filteredClients = clients.filter(client => {
    const normalizedName = removeDiacritics(client.name);
    const normalizedPhone = removeDiacritics(client.phone || '');
    const normalizedSearchTerm = removeDiacritics(searchTerm);
    
    return normalizedName.includes(normalizedSearchTerm) || 
           normalizedPhone.includes(normalizedSearchTerm);
  });

  // Quando um novo cliente é adicionado com sucesso
  const handleClientAdded = (newClient: any) => {
    // Atualizar para usar o novo cliente no formulário
    updateFormValues({ clientId: newClient.id });
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4 text-salon-primary">Selecione o Cliente</h3>
      
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar cliente por nome ou telefone..."
          className="pl-8 rounded-md border-salon-secondary/50"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {loadingClients ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-salon-primary"></div>
        </div>
      ) : (
        <>
          <div className="max-h-64 overflow-y-auto space-y-1 mb-4">
            {filteredClients.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchTerm.length > 0 ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </div>
            ) : (
              filteredClients.map(client => (
                <div
                  key={client.id}
                  className={`p-3 rounded-md border cursor-pointer transition-all ${
                    formValues.clientId === client.id
                      ? "border-salon-primary bg-salon-primary/10"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => updateFormValues({ clientId: client.id })}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{client.name}</div>
                      {client.phone && (
                        <div className="text-sm text-gray-500">{client.phone}</div>
                      )}
                    </div>
                    {formValues.clientId === client.id && (
                      <Check className="h-5 w-5 text-salon-primary" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 rounded-md border-salon-secondary/50"
            onClick={() => setIsAddClientDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Adicionar Novo Cliente
          </Button>

          <ClientDialogQuick
            open={isAddClientDialogOpen}
            onOpenChange={setIsAddClientDialogOpen}
            onSuccess={handleClientAdded}
          />
        </>
      )}
    </div>
  );
};

export default AppointmentClientStep;
