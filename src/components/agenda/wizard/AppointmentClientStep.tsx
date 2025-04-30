
import { useState } from "react";
import { Check, Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppointmentStepProps } from "../AppointmentWizard";

const AppointmentClientStep = ({
  formValues,
  updateFormValues,
  clients,
  loadingClients
}: AppointmentStepProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter clients based on search term
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Selecione o Cliente</h3>
      
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar cliente por nome ou telefone..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {loadingClients ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
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
                      ? "border-primary bg-primary/10"
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
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => {
              // This would normally open a dialog to add a new client
              // For now, just show a message
              alert("Funcionalidade de adicionar cliente será implementada em breve");
            }}
          >
            <UserPlus className="h-4 w-4" />
            Adicionar Novo Cliente
          </Button>
        </>
      )}
    </div>
  );
};

export default AppointmentClientStep;
