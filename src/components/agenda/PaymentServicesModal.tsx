import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [payOnlyCurrentAppointment, setPayOnlyCurrentAppointment] = useState(true);
  const [discount, setDiscount] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  
  // Fetch appointment services and check if it's recurring
  useEffect(() => {
    if (open && appointmentId) {
      fetchAppointmentServices();
      checkIfRecurringAppointment();
    } else {
      // Limpar os estados quando o modal fecha
      setServices([]);
      setPriceInputs({});
      setDiscount("");
      setPaymentNotes("");
      setPayOnlyCurrentAppointment(true);
    }
  }, [open, appointmentId]);
  
  const checkIfRecurringAppointment = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('recurrence_group_id')
        .eq('id', appointmentId)
        .single();
      
      if (error) throw error;
      
      if (data.recurrence_group_id) {
        // Check if there are other appointments in this group
        const { data: relatedAppointments, error: relatedError } = await supabase
          .from('appointments')
          .select('id')
          .eq('recurrence_group_id', data.recurrence_group_id)
          .neq('id', appointmentId);
        
        if (relatedError) throw relatedError;
        
        // If there are other appointments in the same recurrence group
        setIsRecurring(relatedAppointments.length > 0);
      } else {
        setIsRecurring(false);
      }
    } catch (error) {
      console.error("Error checking if appointment is recurring:", error);
      setIsRecurring(false);
    }
  };
  
  const fetchAppointmentServices = async () => {
    setLoading(true);
    try {
      // Buscar os serviços do agendamento, garantindo que não há duplicações
      const { data, error } = await supabase
        .from('appointment_services')
        .select(`
          id,
          service:service_id (
            id,
            name,
            price
          ),
          final_price
        `)
        .eq('appointment_id', appointmentId);

      if (error) throw error;

      // Processar os dados recebidos
      const formattedServices = data.map(item => ({
        id: item.id,
        name: item.service.name,
        price: item.final_price || item.service.price
      }));
      
      // Initialize price inputs with existing final_price or default price
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
    // Garantir que o valor é numérico
    if (value === '' || !isNaN(parseFloat(value))) {
      setPriceInputs(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  // Calculate total price with discount
  const calculateFinalPrice = () => {
    const subtotal = services.reduce((sum, service) => {
      const price = parseFloat(priceInputs[service.id]) || 0;
      return sum + price;
    }, 0);
    
    // Apply discount if present
    if (discount && !isNaN(parseFloat(discount))) {
      const discountValue = parseFloat(discount);
      return Math.max(0, subtotal - discountValue);
    }
    
    return subtotal;
  };

  const totalPrice = calculateFinalPrice();

  // Complete payment
  const handleCompletePayment = async () => {
    // Evita múltiplos envios
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Validar valores de entrada
      for (const service of services) {
        const price = parseFloat(priceInputs[service.id]);
        if (isNaN(price) || price < 0) {
          throw new Error(`Valor inválido para o serviço ${service.name}`);
        }
      }

      // Atualizar preços finais dos serviços
      for (const service of services) {
        const { error } = await supabase
          .from('appointment_services')
          .update({
            final_price: parseFloat(priceInputs[service.id])
          })
          .eq('id', service.id);
        
        if (error) throw error;
      }

      // Get appointment details including recurrence group
      const { data: appointmentData, error: appointmentFetchError } = await supabase
        .from('appointments')
        .select('recurrence_group_id')
        .eq('id', appointmentId)
        .single();
      
      if (appointmentFetchError) throw appointmentFetchError;
      
      // Atualizar o status do agendamento como finalizado e pago
      const paymentDate = new Date().toISOString();
      const updateData = {
        status: "finalizado",
        payment_status: "pago",
        payment_method: paymentMethod,
        final_price: totalPrice,
        payment_date: paymentDate,
        notes: paymentNotes ? (paymentNotes.trim() !== "" ? paymentNotes : null) : null
      };
      
      // Update the current appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (appointmentError) throw appointmentError;
      
      // If this is a recurring appointment and we need to update others in the series
      if (isRecurring && !payOnlyCurrentAppointment && appointmentData.recurrence_group_id) {
        const { error: relatedError } = await supabase
          .from('appointments')
          .update(updateData)
          .eq('recurrence_group_id', appointmentData.recurrence_group_id)
          .neq('id', appointmentId);
          
        if (relatedError) {
          console.error("Error updating related appointments:", relatedError);
          toast({
            title: "Atenção",
            description: "O pagamento atual foi registrado, mas houve um erro ao atualizar os outros agendamentos da série.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sucesso",
            description: "Todos os agendamentos da série foram atualizados.",
          });
        }
      }

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
    } finally {
      setIsSubmitting(false);
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
              <div className="space-y-3 max-h-[30vh] overflow-y-auto">
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
            
            <div className="pt-2 border-t space-y-3">
              {/* Discount field */}
              <div className="flex justify-between items-center">
                <Label htmlFor="discount">Desconto (R$)</Label>
                <Input
                  id="discount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0.00"
                  className="w-24"
                />
              </div>
              
              {/* Notes field */}
              <div className="space-y-1.5">
                <Label htmlFor="payment-notes">Observações</Label>
                <Textarea
                  id="payment-notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Observações sobre o pagamento"
                  className="resize-none"
                />
              </div>

              {/* Recurring appointment option */}
              {isRecurring && (
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox 
                    id="pay-only-current" 
                    checked={payOnlyCurrentAppointment}
                    onCheckedChange={(checked) => setPayOnlyCurrentAppointment(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="pay-only-current">
                      Pagar apenas este agendamento
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Se desmarcado, todos os agendamentos da série terão o pagamento finalizado
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium">Método de Pagamento</span>
                <Select
                  defaultValue="dinheiro"
                  value={paymentMethod}
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
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button 
            onClick={handleCompletePayment} 
            disabled={loading || services.length === 0 || isSubmitting}
            className="relative"
          >
            {isSubmitting ? (
              <>
                <span className="opacity-0">Finalizar Pagamento</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  <span className="ml-2">Processando...</span>
                </div>
              </>
            ) : (
              "Finalizar Pagamento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentServicesModal;
