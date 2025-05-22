
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AppointmentService {
  id: string;
  name: string;
  price: number;
}

interface PaymentServicesModalProps {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
  onSuccess: () => void;
}

const PaymentServicesModal = ({ open, onClose, appointmentId, onSuccess }: PaymentServicesModalProps) => {
  const [services, setServices] = useState<AppointmentService[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");
  const [priceInputs, setPriceInputs] = useState<{[key: string]: string}>({});
  
  // Fetch appointment services
  useEffect(() => {
    if (open && appointmentId) {
      fetchAppointmentServices();
    }
  }, [open, appointmentId]);
  
  const fetchAppointmentServices = async () => {
    setLoading(true);
    try {
      // Buscar os serviços do agendamento
      const { data, error } = await supabase
        .from('appointment_services')
        .select(`
          id,
          service:service_id (
            id,
            name,
            price
          )
        `)
        .eq('appointment_id', appointmentId);

      if (error) throw error;

      // Processar os dados recebidos
      const formattedServices = data.map(item => ({
        id: item.id,
        name: item.service.name,
        price: item.service.price
      }));
      
      // Initialize price inputs
      const initialPriceInputs: {[key: string]: string} = {};
      formattedServices.forEach(service => {
        initialPriceInputs[service.id] = service.price.toString();
      });
      setPriceInputs(initialPriceInputs);
      
      setServices(formattedServices);
    } catch (error: any) {
      console.error('Erro ao carregar serviços:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os serviços deste agendamento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle price change for a service
  const handlePriceChange = (id: string, value: string) => {
    setPriceInputs(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Calculate total price
  const totalPrice = services.reduce((sum, service) => {
    const price = parseFloat(priceInputs[service.id]) || 0;
    return sum + price;
  }, 0);

  // Complete payment
  const handleCompletePayment = async () => {
    try {
      // 1. Atualizar o status do agendamento como finalizado e pago
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({
          status: "finalizado",
          payment_status: "pago",
          payment_method: paymentMethod,
          final_price: totalPrice
        })
        .eq('id', appointmentId);

      if (appointmentError) throw appointmentError;

      // 2. Opcional: atualizar os preços dos serviços se necessário
      // Isso dependerá da estrutura do banco de dados

      toast({
        title: "Pagamento finalizado",
        description: "Pagamento registrado com sucesso.",
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao finalizar pagamento:', error);
      toast({
        title: "Erro",
        description: `Erro ao finalizar pagamento: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Pagamento</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Revise os valores dos serviços antes de finalizar o pagamento:
            </div>
            
            {services.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhum serviço encontrado para este agendamento
              </div>
            ) : (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {services.map((service) => (
                  <div key={service.id} className="flex justify-between items-center p-3 rounded-md border">
                    <div>
                      <p className="font-medium">{service.name}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">R$</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={priceInputs[service.id]}
                        onChange={(e) => handlePriceChange(service.id, e.target.value)}
                        className="w-24"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium">Método de Pagamento</span>
                <Select
                  defaultValue="dinheiro"
                  onValueChange={setPaymentMethod}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Método de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-between items-center text-lg font-medium">
                <span>Valor Total</span>
                <span>R$ {totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleCompletePayment} disabled={loading || services.length === 0}>
            Finalizar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentServicesModal;
