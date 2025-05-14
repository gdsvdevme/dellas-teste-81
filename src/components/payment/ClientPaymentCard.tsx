
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Check, ChevronDown, ChevronUp, CreditCard, Edit, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Appointment } from "./PendingPaymentsByClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogPaymentServices } from "./DialogPaymentServices";

interface ClientPaymentCardProps {
  clientId: string;
  clientName: string;
  clientPhone?: string;
  appointments: Appointment[];
  totalDue: number;
  isOpen: boolean;
  onToggleOpen: () => void;
  onPayment: (appointment: Appointment, method?: string, servicePrices?: Record<string, number>) => void;
  onPayAll: (clientId: string, appointments: Appointment[], method?: string) => void;
  onEdit: (appointment: Appointment) => void;
  selectedIds: string[];
  onToggleSelect: (id: string, isSelected: boolean) => void;
  onUpdatePrice: (appointmentId: string, newPrice: number) => void;
  onPaySelected?: (appointments: Appointment[], method?: string) => void;
}

const ClientPaymentCard: React.FC<ClientPaymentCardProps> = ({
  clientId,
  clientName,
  clientPhone,
  appointments,
  totalDue,
  isOpen,
  onToggleOpen,
  onPayment,
  onPayAll,
  onEdit,
  selectedIds,
  onToggleSelect,
  onUpdatePrice,
  onPaySelected
}) => {
  const [editPrices, setEditPrices] = useState<Record<string, boolean>>({});
  const [priceInputs, setPriceInputs] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState<Appointment | null>(null);

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

  // Abre o diálogo de detalhes de pagamento
  const openPaymentDialog = (appointment: Appointment) => {
    setSelectedAppointmentForPayment(appointment);
    setIsPaymentDialogOpen(true);
  };

  // Processa o pagamento após confirmação no diálogo
  const handlePaymentConfirm = (appointment: Appointment, method: string, servicePrices: Record<string, number>) => {
    onPayment(appointment, method, servicePrices);
  };

  // Calcula o total selecionado
  const selectedTotal = appointments
    .filter(apt => selectedIds.includes(apt.id))
    .reduce((sum, apt) => sum + (apt.final_price || 0), 0);

  const selectedCount = appointments.filter(apt => selectedIds.includes(apt.id)).length;
  
  // Gera link para WhatsApp
  const getWhatsAppLink = (appointment: Appointment) => {
    if (!clientPhone) return null;
    
    const serviceNames = appointment.appointment_services?.map(as => as.service?.name).join(", ") || "Serviço";
    const date = format(new Date(appointment.start_time), "dd/MM/yyyy");
    const amount = appointment.final_price?.toFixed(2);

    const text = encodeURIComponent(`Olá ${clientName}, confirmamos o pagamento do serviço: ${serviceNames} realizado em ${date} no valor de R$ ${amount}. Obrigado!`);
    return `https://wa.me/55${clientPhone.replace(/\D/g, '')}?text=${text}`;
  };

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
              <div className="flex flex-col text-sm">
                <p className="text-muted-foreground">
                  {appointments.length} {appointments.length === 1 ? 'serviço pendente' : 'serviços pendentes'}
                </p>
                {clientPhone && (
                  <p className="text-muted-foreground">
                    📱 {clientPhone}
                  </p>
                )}
              </div>
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
                    
                    <div className="flex gap-2">
                      {/* Botão de pagamento rápido alterado para abrir o diálogo */}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-8 p-1"
                        onClick={() => openPaymentDialog(appointment)}
                        title="Detalhes do Pagamento"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" className="text-xs h-8">
                            <CreditCard className="h-3.5 w-3.5 mr-1" /> Pagar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
                            <AlertDialogDescription>
                              <div className="space-y-4">
                                <p>Deseja marcar este serviço como pago?</p>
                                <p>Valor: R$ {appointment.final_price || 0}</p>
                                
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
                            <AlertDialogAction onClick={() => openPaymentDialog(appointment)}>
                              Continuar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    
                    {clientPhone && (
                      <a 
                        href={getWhatsAppLink(appointment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-salon-primary hover:bg-salon-primary/10 h-8 px-3 py-0"
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-1" /> Enviar
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {selectedCount > 0 && (
            <div className="p-4 bg-salon-primary/5 border-t">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Total selecionado:</span> R$ {selectedTotal.toFixed(2)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
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
                  
                  <div className="flex items-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="w-full">
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
                            if (onPaySelected) {
                              onPaySelected(appointments, paymentMethod);
                            } else {
                              const selectedAppointments = appointments.filter(apt => 
                                selectedIds.includes(apt.id)
                              );
                              
                              selectedAppointments.forEach(apt => {
                                onPayment(apt, paymentMethod);
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
                    <AlertDialogDescription className="space-y-4">
                      <p>
                        Deseja marcar todos os {appointments.length} {appointments.length === 1 ? 'serviço' : 'serviços'} de {clientName} como pagos?
                        Total: R$ {totalDue.toFixed(2)}
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
                    <AlertDialogAction onClick={() => onPayAll(clientId, appointments, paymentMethod)}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      )}

      {/* Dialog for payment details */}
      {selectedAppointmentForPayment && (
        <DialogPaymentServices
          open={isPaymentDialogOpen}
          onClose={() => {
            setIsPaymentDialogOpen(false);
            setSelectedAppointmentForPayment(null);
          }}
          appointment={selectedAppointmentForPayment}
          onConfirmPayment={handlePaymentConfirm}
        />
      )}
    </Card>
  );
};

export default ClientPaymentCard;
