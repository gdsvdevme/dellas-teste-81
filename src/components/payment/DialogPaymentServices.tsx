
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Appointment } from "./PendingPaymentsByClient";

type ServiceDetail = {
  id: string;
  name: string;
  price: number;
  service_id: string;
};

interface DialogPaymentServicesProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
  onConfirmPayment: (appointment: Appointment, method: string, servicePrices: Record<string, number>) => void;
}

export const DialogPaymentServices = ({
  open,
  onClose,
  appointment,
  onConfirmPayment
}: DialogPaymentServicesProps) => {
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({});
  const [totalValue, setTotalValue] = useState<number>(0);
  const isMobile = useIsMobile();

  // Extract services from appointment
  const services: ServiceDetail[] = appointment.appointment_services?.map(as => ({
    id: as.service_id,
    name: as.service?.name || "Serviço",
    price: appointment.final_price || 0, // Default from appointment's final price
    service_id: as.service_id
  })) || [];

  // Initialize service prices
  useEffect(() => {
    if (open && appointment) {
      const initialPrices: Record<string, number> = {};
      
      // If we have multiple services, divide the total price equally by default
      const serviceCount = services.length;
      const pricePerService = serviceCount > 0 
        ? (appointment.final_price || 0) / serviceCount 
        : 0;
        
      services.forEach(service => {
        initialPrices[service.id] = pricePerService;
      });
      
      setServicePrices(initialPrices);
      setTotalValue(appointment.final_price || 0);
    }
  }, [open, appointment, services]);

  // Handle price change for a service
  const handlePriceChange = (serviceId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedPrices = { ...servicePrices, [serviceId]: numValue };
    
    setServicePrices(updatedPrices);
    
    // Recalculate total
    const newTotal = Object.values(updatedPrices).reduce((sum, price) => sum + price, 0);
    setTotalValue(newTotal);
  };

  const handleConfirm = () => {
    onConfirmPayment(appointment, paymentMethod, servicePrices);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={`${isMobile ? 'p-4' : 'p-6'} max-w-md mx-auto`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Detalhes do Pagamento</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4">
            <h3 className="text-base font-medium mb-2">Serviços</h3>
            <ScrollArea className={`rounded-md border ${isMobile ? 'h-[40vh]' : 'h-[45vh]'}`}>
              <div className="p-4 space-y-4">
                {services.length === 0 ? (
                  <p className="text-muted-foreground italic">Nenhum serviço encontrado</p>
                ) : (
                  services.map((service) => (
                    <div key={service.id} className="border rounded-md p-3 space-y-2">
                      <div className="font-medium">{service.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">R$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={servicePrices[service.id] || 0}
                          onChange={(e) => handlePriceChange(service.id, e.target.value)}
                          className="w-full text-right"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-medium">Total:</span>
              <span className="text-lg font-bold">R$ {totalValue.toFixed(2)}</span>
            </div>

            <div className="pt-2">
              <label className="text-sm font-medium mb-2 block">
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
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm}>Confirmar Pagamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
