import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, CheckSquare, DollarSign, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Appointment } from "./PendingPaymentsByClient";

interface PaymentControlsProps {
  selectedCount: number;
  selectedTotal: number;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  areAllSelected: boolean;
  handleToggleAll: (checked: boolean) => void;
  onPaySelectedAppointments: (appointments: Appointment[], method?: string) => void;
  onPayAllForClient: (clientId: string, appointments: Appointment[], method?: string) => void;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const totalAppointments = appointments.length;
  const totalValue = appointments.reduce((sum, apt) => sum + (apt.final_price || 0), 0);

  const handlePaySelected = () => {
    setIsProcessing(true);
    onPaySelectedAppointments(appointments, paymentMethod);
    setTimeout(() => setIsProcessing(false), 1500);
  };

  const handlePayAll = () => {
    setIsProcessing(true);
    if (clientId) {
      onPayAllForClient(clientId, appointments, paymentMethod);
    }
    setTimeout(() => setIsProcessing(false), 1500);
  };

  return (
    <Card className="mb-6 shadow-sm border-salon-secondary/20">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 rounded-full p-2">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total de Serviços</p>
                  <p className="text-2xl font-bold text-blue-700">{totalAppointments}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 rounded-full p-2">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Valor Total</p>
                  <p className="text-2xl font-bold text-green-700">R$ {totalValue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 rounded-full p-2">
                  <CheckSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Selecionados</p>
                  <p className="text-2xl font-bold text-purple-700">{selectedCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controles de Seleção */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Checkbox 
                id="select-all"
                checked={areAllSelected}
                onCheckedChange={handleToggleAll}
                className="h-5 w-5"
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                {areAllSelected ? 'Desmarcar todos' : 'Selecionar todos'}
              </label>
            </div>
            
            {selectedCount > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedCount} de {totalAppointments} selecionados • R$ {selectedTotal.toFixed(2)}
              </div>
            )}
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Método de Pagamento Padrão</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                <SelectItem value="cartao">💳 Cartão</SelectItem>
                <SelectItem value="pix">📱 PIX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ações de Pagamento */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Pagar Selecionados */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="salon" 
                  className="flex-1"
                  disabled={selectedCount === 0 || isProcessing}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pagar Selecionados ({selectedCount})
                  {selectedCount > 0 && (
                    <span className="ml-2 bg-white/20 px-2 py-1 rounded text-xs">
                      R$ {selectedTotal.toFixed(2)}
                    </span>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar pagamento em lote</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3">
                      <p>Deseja marcar <strong>{selectedCount} serviços</strong> como pagos?</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p><strong>Valor total:</strong> R$ {selectedTotal.toFixed(2)}</p>
                        <p><strong>Método:</strong> {paymentMethod === 'dinheiro' ? '💵 Dinheiro' : paymentMethod === 'cartao' ? '💳 Cartão' : '📱 PIX'}</p>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePaySelected}>
                    Confirmar Pagamentos
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Pagar Todos */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  disabled={totalAppointments === 0 || isProcessing}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pagar Todos ({totalAppointments})
                  <span className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                    R$ {totalValue.toFixed(2)}
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar pagamento total</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3">
                      <p>Deseja marcar <strong>todos os {totalAppointments} serviços</strong> deste cliente como pagos?</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p><strong>Valor total:</strong> R$ {totalValue.toFixed(2)}</p>
                        <p><strong>Método:</strong> {paymentMethod === 'dinheiro' ? '💵 Dinheiro' : paymentMethod === 'cartao' ? '💳 Cartão' : '📱 PIX'}</p>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePayAll}>
                    Confirmar Todos os Pagamentos
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
              <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-blue-700 font-medium">Processando pagamentos...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentControls;
