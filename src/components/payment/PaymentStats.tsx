
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, CreditCard, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Appointment } from "@/components/payment/PendingPaymentsByClient";

interface PaymentStatsProps {
  pendingTotal: number;
  paidTotal: number;
  pendingCount: number;
  paidCount: number;
  recentPayments: Appointment[];
}

const PaymentStats: React.FC<PaymentStatsProps> = ({
  pendingTotal,
  paidTotal,
  pendingCount,
  paidCount,
  recentPayments
}) => {
  // Calculate percentage change (for demo, can be replaced with actual logic)
  const calculateChange = () => {
    const change = Math.random() > 0.5 ? 
      { value: (Math.random() * 20).toFixed(1), positive: true } : 
      { value: (Math.random() * 10).toFixed(1), positive: false };
    return change;
  };

  const pendingChange = calculateChange();
  const paidChange = calculateChange();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Pagamentos Pendentes</p>
            <DollarSign className="h-4 w-4 text-salon-secondary" />
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-semibold">R$ {pendingTotal.toFixed(2)}</h3>
            <div className={`text-xs flex items-center ${pendingChange.positive ? 'text-green-600' : 'text-red-600'}`}>
              {pendingChange.positive ? 
                <ArrowUpRight className="h-3 w-3 mr-1" /> : 
                <ArrowDownRight className="h-3 w-3 mr-1" />
              }
              {pendingChange.value}%
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingCount} {pendingCount === 1 ? 'serviço pendente' : 'serviços pendentes'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Pagamentos Recebidos</p>
            <CreditCard className="h-4 w-4 text-salon-secondary" />
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-semibold">R$ {paidTotal.toFixed(2)}</h3>
            <div className={`text-xs flex items-center ${paidChange.positive ? 'text-green-600' : 'text-red-600'}`}>
              {paidChange.positive ? 
                <ArrowUpRight className="h-3 w-3 mr-1" /> : 
                <ArrowDownRight className="h-3 w-3 mr-1" />
              }
              {paidChange.value}%
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {paidCount} {paidCount === 1 ? 'pagamento recebido' : 'pagamentos recebidos'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Método de Pagamento</p>
            <Wallet className="h-4 w-4 text-salon-secondary" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Dinheiro</span>
              <span className="font-medium">42%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-salon-primary h-1.5 rounded-full" style={{ width: "42%" }}></div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Cartão</span>
              <span className="font-medium">38%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-salon-primary h-1.5 rounded-full" style={{ width: "38%" }}></div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>PIX</span>
              <span className="font-medium">20%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-salon-primary h-1.5 rounded-full" style={{ width: "20%" }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Métodos Utilizados</p>
            <CreditCard className="h-4 w-4 text-salon-secondary" />
          </div>
          <div className="space-y-3">
            {recentPayments.slice(0, 3).map((payment, index) => (
              <div key={index} className="flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  payment.payment_method === 'dinheiro' ? 'bg-green-500' :
                  payment.payment_method === 'cartao' ? 'bg-blue-500' : 'bg-purple-500'
                }`}></div>
                <span className="flex-1 truncate">
                  {payment.client?.name?.split(' ')[0] || 'Cliente'}
                </span>
                <span className="font-medium">
                  R$ {payment.final_price?.toFixed(2) || "0.00"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentStats;
