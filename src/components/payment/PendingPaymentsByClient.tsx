
import React from "react";
import { format } from "date-fns";
import { Check, ChevronDown, ChevronUp, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Types
export type Appointment = {
  id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  final_price: number | null;
  notes: string | null;
  client: {
    name: string;
  };
  appointment_services: {
    service: {
      name: string;
    };
  }[];
};

export type ClientAppointments = {
  client_id: string;
  client_name: string;
  appointments: Appointment[];
  totalDue: number;
};

interface PendingPaymentsByClientProps {
  clientGroups: ClientAppointments[];
  isLoading: boolean;
  openCollapsibleIds: string[];
  toggleCollapsible: (clientId: string) => void;
  handlePayment: (appointment: Appointment) => void;
  handlePayAllForClient: (clientId: string, appointments: Appointment[]) => void;
  setSelectedAppointment: (appointment: Appointment | null) => void;
}

const PendingPaymentsByClient = ({
  clientGroups,
  isLoading,
  openCollapsibleIds,
  toggleCollapsible,
  handlePayment,
  handlePayAllForClient,
  setSelectedAppointment
}: PendingPaymentsByClientProps) => {
  if (isLoading) {
    return <div className="flex justify-center py-8">Carregando pagamentos pendentes...</div>;
  }
  
  if (clientGroups.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Não há pagamentos pendentes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {clientGroups.map((clientGroup) => (
        <Card key={clientGroup.client_id}>
          <Collapsible
            open={openCollapsibleIds.includes(clientGroup.client_id)}
            onOpenChange={() => toggleCollapsible(clientGroup.client_id)}
          >
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto">
                      <CardTitle className="flex items-center gap-2">
                        {openCollapsibleIds.includes(clientGroup.client_id) ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
                        }
                        {clientGroup.client_name}
                      </CardTitle>
                    </Button>
                  </CollapsibleTrigger>
                  <div className="text-sm text-muted-foreground mt-1">
                    {clientGroup.appointments.length} serviço(s) pendente(s) - Total: R$ {clientGroup.totalDue.toFixed(2)}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm">
                      <Check className="h-4 w-4 mr-2" /> Pagar Todos
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
                      <AlertDialogDescription>
                        Deseja marcar todos os {clientGroup.appointments.length} serviços de {clientGroup.client_name} como pagos?
                        Total: R$ {clientGroup.totalDue.toFixed(2)}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handlePayAllForClient(clientGroup.client_id, clientGroup.appointments)}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="divide-y">
                  {clientGroup.appointments.map((appointment) => (
                    <div key={appointment.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {appointment.appointment_services?.map(as => as.service?.name).join(", ") || "Serviço não especificado"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(appointment.start_time), "dd/MM/yyyy HH:mm")}
                        </div>
                        <div>
                          R$ {appointment.final_price || 0}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          <Edit className="h-4 w-4 mr-2" /> Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm">
                              <Check className="h-4 w-4 mr-2" /> Pagar
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
                              <AlertDialogAction onClick={() => handlePayment(appointment)}>
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
};

export default PendingPaymentsByClient;
