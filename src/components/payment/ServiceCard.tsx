
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Edit, CreditCard, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Appointment } from "./PendingPaymentsByClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ServiceCardProps {
  appointment: Appointment;
  isSelected: boolean;
  onToggleSelect: (id: string, checked: boolean) => void;
  onEdit: (appointment: Appointment) => void;
  onPay: (appointment: Appointment, method?: string) => void;
  onUpdatePrice: (id: string, price: number) => void;
  clientPhone?: string;
  clientName?: string;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  appointment,
  isSelected,
  onToggleSelect,
  onEdit,
  onPay,
  onUpdatePrice,
  clientPhone,
  clientName,
  paymentMethod,
  setPaymentMethod
}) => {
  const [editPrice, setEditPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(appointment.final_price || 0);

  // Sync priceInput when appointment.final_price changes
  useEffect(() => {
    setPriceInput(appointment.final_price || 0);
  }, [appointment.final_price]);

  const handlePriceChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setPriceInput(numValue);
  };

  const handleSavePrice = () => {
    if (priceInput !== appointment.final_price) {
      onUpdatePrice(appointment.id, priceInput);
    }
    setEditPrice(false);
  };

  // Gera link para WhatsApp
  const getWhatsAppLink = () => {
    if (!clientPhone) return null;
    
    const serviceNames = appointment.appointment_services?.map(as => as.service?.name).join(", ") || "Serviço";
    const date = format(new Date(appointment.start_time), "dd/MM/yyyy");
    const amount = appointment.final_price?.toFixed(2);

    const text = encodeURIComponent(`Olá ${clientName}, confirmamos o pagamento do serviço: ${serviceNames} realizado em ${date} no valor de R$ ${amount}. Obrigado!`);
    return `https://wa.me/55${clientPhone.replace(/\D/g, '')}?text=${text}`;
  };

  return (
    <Card key={appointment.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-salon-secondary/20 mb-3">
      <CardContent className="p-4">
        <div className="flex items-start">
          <Checkbox 
            id={`apt-${appointment.id}`}
            checked={isSelected}
            onCheckedChange={(checked) => {
              if (typeof checked === 'boolean') {
                onToggleSelect(appointment.id, checked);
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
              {editPrice ? (
                <div className="flex items-center gap-2">
                  <Input 
                    type="number"
                    value={priceInput}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="w-24 h-8 text-sm"
                    onBlur={handleSavePrice}
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePrice()}
                    autoFocus
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={handleSavePrice}
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
                    onClick={() => setEditPrice(true)}
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
              onClick={() => onEdit(appointment)}
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
                          value={paymentMethod}
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
                  <AlertDialogAction onClick={() => onPay(appointment, paymentMethod)}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {clientPhone && (
              <a 
                href={getWhatsAppLink()}
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
  );
};

export default ServiceCard;
