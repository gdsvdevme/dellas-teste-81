
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Check, CreditCard, Edit, MessageSquare } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DialogEditPayment } from "@/components/payment/DialogEditPayment";
import { usePaymentManagement } from "@/hooks/usePaymentManagement";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Appointment } from "@/components/payment/PendingPaymentsByClient";

const ClientePagamento = () => {
  const { clientId } = useParams();
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");
  const [editPrices, setEditPrices] = useState<Record<string, boolean>>({});
  const [priceInputs, setPriceInputs] = useState<Record<string, number>>({});
  
  const {
    pendingPaymentsByClient,
    isLoading,
    selectedAppointment,
    setSelectedAppointment,
    handlePayment,
    handlePayAllForClient,
    updateAppointmentMutation,
    selectedAppointmentIds,
    toggleAppointmentSelection,
    updateAppointmentPrice,
    handlePaySelectedAppointments
  } = usePaymentManagement();

  // Encontrar o grupo de cliente atual com base no clientId da URL
  const clientGroup = pendingPaymentsByClient.find(group => group.client_id === clientId);
  
  useEffect(() => {
    // Inicializa os valores de preço ao carregar a página
    if (clientGroup) {
      const inputs: Record<string, number> = {};
      clientGroup.appointments.forEach(apt => {
        inputs[apt.id] = apt.final_price || 0;
      });
      setPriceInputs(inputs);
    }
  }, [clientGroup]);

  const toggleEditPrice = (appointmentId: string) => {
    setEditPrices(prev => ({ ...prev, [appointmentId]: !prev[appointmentId] }));
  };

  const handlePriceChange = (appointmentId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPriceInputs(prev => ({ ...prev, [appointmentId]: numValue }));
  };

  const handleSavePrice = (appointmentId: string) => {
    updateAppointmentPrice(appointmentId, priceInputs[appointmentId]);
    toggleEditPrice(appointmentId);
  };

  // Calcula o total selecionado
  const selectedTotal = clientGroup?.appointments
    .filter(apt => selectedAppointmentIds.includes(apt.id))
    .reduce((sum, apt) => sum + (apt.final_price || 0), 0) || 0;

  const selectedCount = clientGroup?.appointments
    .filter(apt => selectedAppointmentIds.includes(apt.id))
    .length || 0;

  // Gera link para WhatsApp
  const getWhatsAppLink = (appointment: Appointment, clientPhone?: string) => {
    if (!clientPhone) return null;
    
    const serviceNames = appointment.appointment_services?.map(as => as.service?.name).join(", ") || "Serviço";
    const date = format(new Date(appointment.start_time), "dd/MM/yyyy");
    const amount = appointment.final_price?.toFixed(2);

    const text = encodeURIComponent(`Olá ${clientGroup?.client_name}, confirmamos o pagamento do serviço: ${serviceNames} realizado em ${date} no valor de R$ ${amount}. Obrigado!`);
    return `https://wa.me/55${clientPhone.replace(/\D/g, '')}?text=${text}`;
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-8">Carregando dados do cliente...</div>
      </PageContainer>
    );
  }

  if (!clientGroup) {
    return (
      <PageContainer>
        <PageHeader
          title="Cliente não encontrado"
          subtitle="O cliente especificado não foi encontrado ou não possui pagamentos pendentes."
        />
        <div className="mt-4">
          <Link to="/pagamentos">
            <Button variant="outline" className="flex items-center gap-2">
              <ChevronLeft size={16} /> Voltar para Pagamentos
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const areAllSelected = clientGroup.appointments.length > 0 && 
    clientGroup.appointments.every(apt => selectedAppointmentIds.includes(apt.id));

  const handleToggleAll = (checked: boolean) => {
    clientGroup.appointments.forEach(apt => {
      if (checked !== selectedAppointmentIds.includes(apt.id)) {
        toggleAppointmentSelection(apt.id, checked);
      }
    });
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <Link to="/pagamentos">
          <Button variant="outline" className="flex items-center gap-2">
            <ChevronLeft size={16} /> Voltar para Pagamentos
          </Button>
        </Link>
      </div>

      <PageHeader
        title={clientGroup.client_name}
        subtitle={clientGroup.client_phone ? `📱 ${clientGroup.client_phone}` : undefined}
        highlightedAmount={{
          label: `${clientGroup.appointments.length} ${clientGroup.appointments.length === 1 ? 'serviço pendente' : 'serviços pendentes'}`,
          amount: clientGroup.totalDue
        }}
      />

      {selectedCount > 0 ? (
        <Card className="mb-6 shadow-sm border-salon-secondary/20">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="select-all"
                    checked={areAllSelected}
                    onCheckedChange={handleToggleAll}
                  />
                  <label 
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Selecionar todos
                  </label>
                </div>
                
                <div className="text-sm font-medium">
                  {selectedCount} {selectedCount === 1 ? 'selecionado' : 'selecionados'} 
                  <span className="text-salon-primary ml-2">
                    (R$ {selectedTotal.toFixed(2)})
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <Select 
                  defaultValue="dinheiro"
                  onValueChange={setPaymentMethod}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Método de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="salon" className="w-full">
                      <Check className="h-4 w-4 mr-1" /> Pagar selecionados
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
                        if (handlePaySelectedAppointments) {
                          handlePaySelectedAppointments(clientGroup.appointments, paymentMethod);
                        } else {
                          const selectedAppointments = clientGroup.appointments.filter(apt => 
                            selectedAppointmentIds.includes(apt.id)
                          );
                          
                          selectedAppointments.forEach(apt => {
                            handlePayment(apt, paymentMethod);
                          });
                        }
                      }}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 shadow-sm border-salon-secondary/20">
          <CardContent className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="select-all"
                checked={areAllSelected}
                onCheckedChange={handleToggleAll}
              />
              <label 
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer"
              >
                Selecionar todos
              </label>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="salon">
                  <Check className="h-4 w-4 mr-2" /> Pagar todos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>
                      Deseja marcar todos os {clientGroup.appointments.length} {clientGroup.appointments.length === 1 ? 'serviço' : 'serviços'} de {clientGroup.client_name} como pagos?
                      Total: R$ {clientGroup.totalDue.toFixed(2)}
                    </p>
                    
                    <div className="pt-2">
                      <label className="text-sm font-medium mb-1 block">
                        Método de Pagamento
                      </label>
                      <Select 
                        defaultValue="dinheiro"
                        onValueChange={setPaymentMethod}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o método de pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="cartao">Cartão</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handlePayAllForClient(clientId!, clientGroup.appointments, paymentMethod)}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-3">Serviços Pendentes</h2>
        
        {clientGroup.appointments.map((appointment) => (
          <Card key={appointment.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-salon-secondary/20 mb-3">
            <CardContent className="p-4">
              <div className="flex items-start">
                <Checkbox 
                  id={`apt-${appointment.id}`}
                  checked={selectedAppointmentIds.includes(appointment.id)}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') {
                      toggleAppointmentSelection(appointment.id, checked);
                    }
                  }}
                  className="mt-1 mr-3"
                />
                
                <div className="flex-grow">
                  <div className="font-medium text-lg">
                    {appointment.appointment_services?.map(as => as.service?.name).join(", ") || "Serviço não especificado"}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {format(new Date(appointment.start_time), "dd/MM/yyyy HH:mm")}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
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
                        <span className="font-medium text-lg text-salon-primary">R$ {appointment.final_price?.toFixed(2) || "0.00"}</span>
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

                  {appointment.notes && (
                    <div className="text-sm text-muted-foreground bg-secondary/10 p-2 rounded-md mb-3">
                      <strong>Observações:</strong> {appointment.notes}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs"
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="salon" className="text-xs">
                        <CreditCard className="h-3.5 w-3.5 mr-1" /> Pagar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
                        <AlertDialogDescription>
                          <div className="space-y-4">
                            <p>Deseja marcar este serviço como pago?</p>
                            <p>Valor: R$ {appointment.final_price?.toFixed(2) || "0.00"}</p>
                            
                            <div className="pt-2">
                              <label className="text-sm font-medium mb-1 block">
                                Método de Pagamento
                              </label>
                              <Select 
                                defaultValue="dinheiro"
                                onValueChange={setPaymentMethod}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecione o método de pagamento" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                  <SelectItem value="cartao">Cartão</SelectItem>
                                  <SelectItem value="pix">PIX</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handlePayment(appointment, paymentMethod)}>
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  {clientGroup.client_phone && (
                    <a 
                      href={getWhatsAppLink(appointment, clientGroup.client_phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-salon-primary hover:bg-salon-primary/10 h-8 px-3 py-0"
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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

export default ClientePagamento;
