
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Calendar, DollarSign, Users } from "lucide-react";

// Interfaces para os dados
interface Appointment {
  id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  client: {
    name: string;
  };
}

interface FinancialSummary {
  income: number;
  expenses: number;
}

interface InventoryAlert {
  id: string;
  name: string;
  quantity: number;
}

const Dashboard = () => {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    income: 0,
    expenses: 0,
  });
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Obter data atual para filtrar agendamentos
        const today = new Date();
        const startOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        ).toISOString();
        const endOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          23,
          59,
          59
        ).toISOString();

        // Buscar agendamentos do dia
        const { data: appointments, error: appointmentsError } = await supabase
          .from("appointments")
          .select("*, client:clients(name)")
          .gte("start_time", startOfDay)
          .lte("start_time", endOfDay)
          .order("start_time", { ascending: true });

        if (appointmentsError) throw appointmentsError;

        // Buscar resumo financeiro do mês atual
        const startOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        ).toISOString();
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0,
          23,
          59,
          59
        ).toISOString();

        const { data: finances, error: financesError } = await supabase
          .from("financial_transactions")
          .select("amount, type")
          .gte("transaction_date", startOfMonth)
          .lte("transaction_date", endOfMonth);

        if (financesError) throw financesError;

        // Calcular resumo financeiro
        const income = finances
          .filter((item) => item.type === "income")
          .reduce((sum, item) => sum + Number(item.amount), 0);
        const expenses = finances
          .filter((item) => item.type === "expense")
          .reduce((sum, item) => sum + Number(item.amount), 0);

        // Buscar produtos com estoque baixo (menos de 5 unidades)
        const { data: inventory, error: inventoryError } = await supabase
          .from("inventory")
          .select("id, name, quantity")
          .lt("quantity", 5)
          .order("quantity", { ascending: true });

        if (inventoryError) throw inventoryError;

        // Atualizar estado com os dados
        setTodayAppointments(appointments as Appointment[]);
        setFinancialSummary({ income, expenses });
        setInventoryAlerts(inventory as InventoryAlert[]);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Função para formatar data/hora
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Função para obter classe de status
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "scheduled":
        return "info";
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      case "payment_pending":
        return "warning";
      default:
        return "default";
    }
  };

  // Tradução de status
  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      scheduled: "Agendado",
      completed: "Finalizado",
      cancelled: "Cancelado",
      payment_pending: "Pagamento Pendente",
    };
    return statusMap[status] || status;
  };

  // Formatação de valores monetários
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle="Bem-vindo ao sistema Dellas - Cabelo & Pele"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Agendamentos Hoje
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : todayAppointments.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : formatCurrency(financialSummary.income)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Despesas (Mês)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? "..." : formatCurrency(financialSummary.expenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Carregando agendamentos...</p>
            ) : todayAppointments.length === 0 ? (
              <p className="text-muted-foreground">
                Não há agendamentos para hoje
              </p>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{appointment.client?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(appointment.start_time)} -{" "}
                        {formatTime(appointment.end_time)}
                      </p>
                    </div>
                    <StatusBadge variant={getStatusVariant(appointment.status)}>
                      {translateStatus(appointment.status)}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos com Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Carregando dados...</p>
            ) : inventoryAlerts.length === 0 ? (
              <p className="text-muted-foreground">
                Não há produtos com estoque baixo
              </p>
            ) : (
              <div className="space-y-4">
                {inventoryAlerts.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <p className="font-medium">{item.name}</p>
                    <div className="flex items-center">
                      <p
                        className={`font-semibold ${
                          item.quantity === 0
                            ? "text-red-600"
                            : item.quantity < 3
                            ? "text-amber-600"
                            : "text-orange-500"
                        }`}
                      >
                        {item.quantity} unidades
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
