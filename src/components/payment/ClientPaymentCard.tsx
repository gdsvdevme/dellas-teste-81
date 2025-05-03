
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ChevronUp, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Appointment } from "./PendingPaymentsByClient";

interface ClientPaymentCardProps {
  clientId: string;
  clientName: string;
  appointments: Appointment[];
  totalDue: number;
  isOpen: boolean;
  onToggleOpen: () => void;
  onPayment: (appointment: Appointment) => void;
  onPayAll: (clientId: string, appointments: Appointment[]) => void;
  onEdit: (appointment: Appointment) => void;
  selectedIds: string[];
  onToggleSelect: (id: string, isSelected: boolean) => void;
  onUpdatePrice: (appointmentId: string, newPrice: number) => void;
}

const ClientPaymentCard: React.FC<ClientPaymentCardProps> = ({
  clientId,
  clientName,
  appointments,
  totalDue,
  isOpen,
  onToggleOpen,
  onPayment,
  onPayAll,
  onEdit,
  selectedIds,
  onToggleSelect,
  onUpdatePrice
}) => {
  const [editPrices, setEditPrices] = useState<Record<string, boolean>>({});
  const [priceInputs, setPriceInputs] = useState<Record<string, number>>({});

  // Inicializa os valores de preço ao expandir o card
  const handleToggle = () => {
    if (!isOpen) {
      const inputs: Record<string, number> = {};
      appointments.forEach(apt => {
        inputs[apt.id] = apt.final_price || 0;
      });
      setPriceInputs(inputs);
    }
    onToggleOpen();
  };

  const toggleEditPrice = (appointmentId: string) => {
    setEditPrices(prev => ({ ...prev, [appointmentId]: !prev[appointmentId] }));
  };

  const handlePriceChange = (appointmentId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPriceInputs(prev => ({ ...prev, [appointmentId]: numValue }));
  };

  const handleSavePrice = (appointmentId: string) => {
    onUpdatePrice(appointmentId, priceInputs[appointmentId]);
    toggleEditPrice(appointmentId);
  };

  const areAllSelected = appointments.length > 0 && 
    appointments.every(apt => selectedIds.includes(apt.id));

  const handleToggleAll = (checked: boolean) => {
    appointments.forEach(apt => {
      if (checked !== selectedIds.includes(apt.id)) {
        onToggleSelect(apt.id, checked);
      }
    });
  };

  // Calcula o total selecionado
  const selectedTotal = appointments
    .filter(apt => selectedIds.includes(apt.id))
    .reduce((sum, apt) => sum + (apt.final_price || 0), 0);

  const selectedCount = appointments.filter(apt => selectedIds.includes(apt.id)).length;

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader 
        className="p-4 cursor-pointer bg-white"
        onClick={handleToggle} 
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOpen ? 
              <ChevronUp className="h-5 w-5 text-salon-primary" /> : 
              <ChevronDown className="h-5 w-5 text-salon-primary" />
            }
            <div>
              <h3 className="text-lg font-medium">{clientName}</h3>
              <p className="text-sm text-muted-foreground">
                {appointments.length} {appointments.length === 1 ? 'serviço pendente' : 'serviços pendentes'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-medium text-lg">
              R$ {totalDue.toFixed(2)}
            </span>
          </div>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="p-0 border-t">
          <div className="p-3 bg-salon-primary/5 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id={`select-all-${clientId}`}
                  checked={areAllSelected}
                  onCheckedChange={handleToggleAll}
                />
                <label 
                  htmlFor={`select-all-${clientId}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  Selecionar todos
                </label>
              </div>
              
              {selectedCount > 0 && (
                <div className="text-sm">
                  {selectedCount} {selectedCount === 1 ? 'selecionado' : 'selecionados'} 
                  <span className="font-medium ml-2">
                    (R$ {selectedTotal.toFixed(2)})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="divide-y">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="p-4 hover:bg-salon-secondary/5">
                <div className="flex items-start">
                  <Checkbox 
                    id={`apt-${appointment.id}`}
                    checked={selectedIds.includes(appointment.id)}
                    onCheckedChange={(checked) => {
                      if (typeof checked === 'boolean') {
                        onToggleSelect(appointment.id, checked);
                      }
                    }}
                    className="mt-1 mr-3"
                  />
                  
                  <div className="flex-grow">
                    <div className="font-medium">
                      {appointment.appointment_services?.map(as => as.service?.name).join(", ") || "Serviço não especificado"}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {format(new Date(appointment.start_time), "dd/MM/yyyy HH:mm")}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {editPrices[appointment.id] ? (
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number"
                            value={priceInputs[appointment.id]}
                            onChange={(e) => handlePriceChange(appointment.id, e.target.value)}
                            className="w-24 h-8 text-sm"
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => handleSavePrice(appointment.id)}
                          >
                            Salvar
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium">R$ {appointment.final_price || 0}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 p-1"
                            onClick={() => toggleEditPrice(appointment.id)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => onEdit(appointment)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" className="text-xs h-8">
                          <Check className="h-3.5 w-3.5 mr-1" /> Pagar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja marcar este serviço como pago?
                            Valor: R$ {appointment.final_price || 0}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onPayment(appointment)}>
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {selectedCount > 0 && (
            <div className="p-4 bg-salon-primary/5 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Total selecionado:</span> R$ {selectedTotal.toFixed(2)}
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button>
                      <Check className="h-4 w-4 mr-2" /> Pagar selecionados
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
                      <AlertDialogDescription>
                        Deseja marcar {selectedCount} {selectedCount === 1 ? 'serviço' : 'serviços'} como pagos?
                        Total: R$ {selectedTotal.toFixed(2)}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => {
                        const selectedAppointments = appointments.filter(apt => 
                          selectedIds.includes(apt.id)
                        );
                        
                        selectedAppointments.forEach(apt => {
                          onPayment(apt);
                        });
                      }}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
          
          {selectedCount === 0 && appointments.length > 0 && (
            <div className="p-4 border-t flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <Check className="h-4 w-4 mr-2" /> Pagar todos
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
                    <AlertDialogDescription>
                      Deseja marcar todos os {appointments.length} {appointments.length === 1 ? 'serviço' : 'serviços'} de {clientName} como pagos?
                      Total: R$ {totalDue.toFixed(2)}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onPayAll(clientId, appointments)}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ClientPaymentCard;
