
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Appointment } from "./PendingPaymentsByClient";

interface PaymentControlsProps {
  selectedCount: number;
  selectedTotal: number;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  areAllSelected: boolean;
  handleToggleAll: (checked: boolean) => void;
  onPaySelectedAppointments?: (appointments: Appointment[], method?: string) => void;
  onPayAllForClient?: (clientId: string, appointments: Appointment[], method?: string) => void;
  clientId?: string;
  appointments: Appointment[];
}

const PaymentControls: React.FC<PaymentControlsProps> = ({
  selectedCount,
  selectedTotal,
  paymentMethod,
  setPaymentMethod,
  areAllSelected,
  handleToggleAll,
  onPaySelectedAppointments,
  onPayAllForClient,
  clientId,
  appointments
}) => {
  if (selectedCount > 0) {
    return (
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
                value={paymentMethod}
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
                      if (onPaySelectedAppointments) {
                        onPaySelectedAppointments(appointments, paymentMethod);
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
    );
  }

  return (
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
                  Deseja marcar todos os {appointments.length} {appointments.length === 1 ? 'serviço' : 'serviços'} como pagos?
                  Total: R$ {appointments.reduce((sum, apt) => sum + (apt.final_price || 0), 0).toFixed(2)}
                </p>
                
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
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (onPayAllForClient && clientId) {
                  onPayAllForClient(clientId, appointments, paymentMethod);
                }
              }}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default PaymentControls;
