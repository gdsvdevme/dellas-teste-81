import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronUp, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { DialogEditPayment } from "@/components/payment/DialogEditPayment";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Define appointment type based on the database schema
type Appointment = {
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

// Group appointments by client
type ClientAppointments = {
  client_id: string;
  client_name: string;
  appointments: Appointment[];
  totalDue: number;
};

const Pagamentos: React.FC = () => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [openCollapsibleIds, setOpenCollapsibleIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Fetch appointments with client details
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      console.log("Fetching appointments");
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:client_id (
            name
          ),
          appointment_services (
            service_id,
            service:service_id (
              name
            )
          )
        `);

      if (error) {
        toast.error("Erro ao carregar agendamentos");
        console.error("Error fetching appointments:", error);
        return [];
      }
      
      console.log("Appointments data:", data);
      return data as Appointment[];
    }
  });

  // Mutation for updating appointment status
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string, values: { status: string, payment_status: string, final_price?: number } }) => {
      const { error } = await supabase
        .from('appointments')
        .update(values)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success("Pagamento atualizado com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar pagamento: ${error.message}`);
    }
  });

  // Handle payment
  const handlePayment = (appointment: Appointment) => {
    updateAppointmentMutation.mutate({
      id: appointment.id,
      values: { 
        status: "finalizado", 
        payment_status: "pago",
        // Keep the same final_price if it already exists
        ...(appointment.final_price && { final_price: appointment.final_price })
      }
    });
  };

  // Handle payment for all appointments of a client
  const handlePayAllForClient = (clientId: string, appointments: Appointment[]) => {
    appointments.forEach(appointment => {
      updateAppointmentMutation.mutate({
        id: appointment.id,
        values: { 
          status: "finalizado", 
          payment_status: "pago",
          ...(appointment.final_price && { final_price: appointment.final_price })
        }
      });
    });
  };

  // Toggle collapsible open/closed state
  const toggleCollapsible = (clientId: string) => {
    setOpenCollapsibleIds(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  // Group appointments by client for pending payments
  const pendingPaymentsByClient = React.useMemo(() => {
    const clientMap = new Map<string, ClientAppointments>();
    
    appointments
      .filter(appointment => appointment.payment_status === 'pendente')
      .forEach(appointment => {
        const clientId = appointment.client_id;
        const clientName = appointment.client?.name || 'Cliente Desconhecido';
        const price = appointment.final_price || 0;

        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            client_id: clientId,
            client_name: clientName,
            appointments: [],
            totalDue: 0
          });
        }

        const client = clientMap.get(clientId)!;
        client.appointments.push(appointment);
        client.totalDue += price;
      });

    return Array.from(clientMap.values());
  }, [appointments]);

  // Paid appointments for table display
  const paidAppointments = React.useMemo(() => {
    const paid = appointments.filter(appointment => appointment.payment_status === 'pago');
    console.log("Paid appointments:", paid);
    return paid;
  }, [appointments]);

  // Table columns for paid appointments
  const paidColumns = [
    {
      header: "Data",
      accessorKey: "start_time",
      cell: (info: any) => {
        const date = info.row.original.start_time;
        return date ? format(new Date(date), "dd/MM/yyyy HH:mm") : "Data não disponível";
      }
    },
    {
      header: "Cliente",
      accessorKey: "client.name",
      cell: (info: any) => info.row.original.client?.name || "Cliente não especificado"
    },
    {
      header: "Serviço",
      accessorKey: "service_name",
      cell: (info: any) => {
        const services = info.row.original.appointment_services || [];
        return services.length > 0
          ? services.map((as: any) => as.service?.name).filter(Boolean).join(", ")
          : "Não especificado";
      }
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (info: any) => (
        <StatusBadge variant={info.row.original.status === "finalizado" ? "success" : "warning"}>
          {info.row.original.status === "finalizado" ? "Finalizado" : "Agendado"}
        </StatusBadge>
      )
    },
    {
      header: "Valor",
      accessorKey: "final_price",
      cell: (info: any) => `R$ ${info.row.original.final_price || 0}`
    },
    {
      header: "Ações",
      accessorKey: "id",
      cell: (info: any) => (
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => setSelectedAppointment(info.row.original)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="Pagamentos" 
        subtitle="Gerencie pagamentos pendentes e realizados"
      />

      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="paid">Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {isLoading ? (
            <div className="flex justify-center py-8">Carregando pagamentos pendentes...</div>
          ) : pendingPaymentsByClient.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Não há pagamentos pendentes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPaymentsByClient.map((clientGroup) => (
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
          )}
        </TabsContent>

        <TabsContent value="paid">
          {isLoading ? (
            <div className="flex justify-center py-8">Carregando pagamentos realizados...</div>
          ) : (
            <>
              {paidAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Não há pagamentos realizados</p>
                </div>
              ) : (
                <DataTable
                  data={paidAppointments}
                  columns={paidColumns}
                  searchField="client.name"
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {selectedAppointment && (
        <DialogEditPayment
          appointment={selectedAppointment}
          open={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={(values) => {
            updateAppointmentMutation.mutate({
              id: selectedAppointment.id,
              values
            });
            setSelectedAppointment(null);
          }}
        />
      )}
    </PageContainer>
  );
};

export default Pagamentos;
