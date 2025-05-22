
import { Card, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatisticsCardsProps {
  totalAppointments: number;
  completedAppointments: number;
  pendingPayments: number;
  totalSpent: number;
}

export const StatisticsCards = ({
  totalAppointments,
  completedAppointments,
  pendingPayments,
  totalSpent,
}: StatisticsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="p-4">
          <CardDescription>Total de Atendimentos</CardDescription>
          <CardTitle className="text-2xl">{totalAppointments}</CardTitle>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader className="p-4">
          <CardDescription>Atendimentos Realizados</CardDescription>
          <CardTitle className="text-2xl">{completedAppointments}</CardTitle>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader className="p-4">
          <CardDescription>Pagamentos Pendentes</CardDescription>
          <CardTitle className={cn("text-2xl", pendingPayments > 0 ? "text-amber-500" : "")}>
            {pendingPayments}
          </CardTitle>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader className="p-4">
          <CardDescription>Total Gasto</CardDescription>
          <CardTitle className="text-2xl">R$ {totalSpent.toFixed(2)}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
};
