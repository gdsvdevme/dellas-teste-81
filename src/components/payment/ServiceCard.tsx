
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Edit, CreditCard, MessageSquare, Calendar, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Appointment } from "./PendingPaymentsByClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PriceEditor from "./PriceEditor";
import PaymentStatusBadge from "./PaymentStatusBadge";

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
  const [editingPrice, setEditingPrice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePriceUpdate = (newPrice: number) => {
    if (newPrice !== (appointment.final_price || 0)) {
      setIsProcessing(true);
      onUpdatePrice(appointment.id, newPrice);
      
      // Simular delay de processamento para feedback visual
      setTimeout(() => {
        setIsProcessing(false);
        setEditingPrice(false);
      }, 1000);
    } else {
      setEditingPrice(false);
    }
  };

  const handlePayment = (method?: string) => {
    setIsProcessing(true);
    onPay(appointment, method);
    
    // Reset processing após delay
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
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
    <Card className="overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 border-salon-secondary/20 mb-3 relative">
      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 border-2 border-salon-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-salon-primary font-medium">Processando...</span>
          </div>
        </div>
      )}
      
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Checkbox 
            id={`apt-${appointment.id}`}
            checked={isSelected}
            onCheckedChange={(checked) => {
              if (typeof checked === 'boolean') {
                onToggleSelect(appointment.id, checked);
              }
            }}
            className="mt-1 h-5 w-5"
            disabled={isProcessing}
          />
          
          <div className="flex-grow space-y-3">
            {/* Header com status */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {appointment.appointment_services?.map(as => as.service?.name).join(", ") || "Serviço não especificado"}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(appointment.start_time), "dd/MM/yyyy HH:mm")}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {clientName}
                  </div>
                </div>
              </div>
              <PaymentStatusBadge 
                status={isProcessing ? 'processing' : 'pending'} 
              />
            </div>
            
            {/* Preço */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Valor do serviço:</span>
                <PriceEditor
                  value={appointment.final_price || 0}
                  onSave={handlePriceUpdate}
                  onCancel={() => setEditingPrice(false)}
                  isEditing={editingPrice}
                  onEditToggle={() => setEditingPrice(true)}
                  disabled={isProcessing}
                />
              </div>
            </div>

            {/* Observações */}
            {appointment.notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-blue-900">Observações:</span>
                    <p className="text-sm text-blue-800 mt-1">{appointment.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Ações */}
          <div className="flex flex-col gap-2 min-w-[120px]">
            <Button 
              size="sm" 
              variant="outline"
              className="text-xs h-8 justify-start"
              onClick={() => onEdit(appointment)}
              disabled={isProcessing}
            >
              <Edit className="h-3.5 w-3.5 mr-2" /> 
              Editar
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="salon" 
                  className="text-xs h-8 justify-start"
                  disabled={isProcessing}
                >
                  <CreditCard className="h-3.5 w-3.5 mr-2" /> 
                  Pagar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <p><span className="font-medium">Serviço:</span> {appointment.appointment_services?.map(as => as.service?.name).join(", ")}</p>
                        <p><span className="font-medium">Cliente:</span> {clientName}</p>
                        <p><span className="font-medium">Data:</span> {format(new Date(appointment.start_time), "dd/MM/yyyy HH:mm")}</p>
                        <p><span className="font-medium">Valor:</span> R$ {(appointment.final_price || 0).toFixed(2)}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Método de Pagamento
                        </label>
                        <Select 
                          value={paymentMethod}
                          onValueChange={setPaymentMethod}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o método de pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                            <SelectItem value="cartao">💳 Cartão</SelectItem>
                            <SelectItem value="pix">📱 PIX</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handlePayment(paymentMethod)}>
                    Confirmar Pagamento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {clientPhone && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-8 justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                asChild
                disabled={isProcessing}
              >
                <a 
                  href={getWhatsAppLink() || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-2" /> 
                  WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
