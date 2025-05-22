
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ChevronLeft, Calendar, Search, Filter, FileText, Edit } from "lucide-react";
import { DateRange } from "react-day-picker";
import { ptBR } from "date-fns/locale";

import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useClientHistory, AppointmentWithServices } from "@/hooks/useClientHistory";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { DialogEditPayment } from "@/components/payment/DialogEditPayment";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { usePaymentManagement } from "@/hooks/usePaymentManagement";

const ClienteHistorico = () => {
  const { clientId = "" } = useParams();
  const navigate = useNavigate();
  const [date, setDate] = useState<DateRange | undefined>();
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithServices | null>(null);
  const { updateAppointmentMutation } = usePaymentManagement();
  
  const {
    clientDetails,
    appointments,
    allAppointments,
    isLoading,
    tabValue,
    setTabValue,
    searchTerm,
    setSearchTerm,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sendWhatsAppReport,
  } = useClientHistory(clientId);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDate(range);
    setStartDate(range?.from);
    setEndDate(range?.to);
  };

  const handleRowClick = (appointment: AppointmentWithServices) => {
    setSelectedAppointment(appointment);
  };

  const handleBackToClients = () => {
    navigate("/clientes");
  };

  const handlePaymentUpdate = (values: any) => {
    if (!selectedAppointment) return;
    
    updateAppointmentMutation.mutate({
      id: selectedAppointment.id,
      values
    });
    
    setSelectedAppointment(null);
  };

  // Calculate client stats
  const totalAppointments = allAppointments.length;
  const completedAppointments = allAppointments.filter(a => a.status === "finalizado").length;
  const pendingPayments = allAppointments.filter(a => a.payment_status === "pendente").length;
  const totalSpent = allAppointments.reduce((sum, apt) => sum + (apt.final_price || 0), 0);

  // Filter appointments by tab
  const paidAppointments = allAppointments.filter(apt => apt.payment_status === "pago");
  const pendingAppointments = allAppointments.filter(apt => apt.payment_status === "pendente");
  
  // Configure columns for the appointment tables
  const appointmentColumns = [
    {
      header: "Data",
      accessorKey: "start_time" as keyof AppointmentWithServices,
      cell: ({ row }: { row: { original: AppointmentWithServices } }) => (
        <span>{format(new Date(row.original.start_time), "dd/MM/yyyy HH:mm")}</span>
      ),
    },
    {
      header: "Serviços",
      accessorKey: (row: AppointmentWithServices) => row.appointment_services?.map(s => s.service?.name).join(", "),
      cell: ({ row }: { row: { original: AppointmentWithServices } }) => (
        <div>
          {row.original.appointment_services?.map((as, i) => (
            <Badge key={i} variant="outline" className="mr-1 mb-1">
              {as.service?.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status" as keyof AppointmentWithServices,
      cell: ({ row }: { row: { original: AppointmentWithServices } }) => (
        <StatusBadge variant={row.original.status === "finalizado" ? "success" : "warning"}>
          {row.original.status === "finalizado" ? "Finalizado" : "Agendado"}
        </StatusBadge>
      ),
    },
    {
      header: "Pagamento",
      accessorKey: "payment_status" as keyof AppointmentWithServices,
      cell: ({ row }: { row: { original: AppointmentWithServices } }) => (
        <StatusBadge variant={row.original.payment_status === "pago" ? "success" : "warning"}>
          {row.original.payment_status === "pago" ? "Pago" : "Pendente"}
        </StatusBadge>
      ),
    },
    {
      header: "Valor",
      accessorKey: "final_price" as keyof AppointmentWithServices,
      cell: ({ row }: { row: { original: AppointmentWithServices } }) => (
        <span className="font-medium">
          R$ {row.original.final_price || "Não definido"}
        </span>
      ),
    },
    {
      header: "Ações",
      accessorKey: (row: AppointmentWithServices) => row.id,
      cell: ({ row }: { row: { original: AppointmentWithServices } }) => (
        <Button 
          size="sm" 
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedAppointment(row.original);
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (isLoading || !clientDetails) {
    return (
      <PageContainer>
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-salon-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Button 
        variant="ghost" 
        onClick={handleBackToClients}
        className="mb-4"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Voltar para Clientes
      </Button>
      
      <PageHeader 
        title={clientDetails.name} 
        subtitle={clientDetails.phone || "Telefone não cadastrado"}
      >
        <Button 
          onClick={() => sendWhatsAppReport(paidAppointments)}
          className="flex items-center gap-2"
          disabled={paidAppointments.length === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"></path>
            <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z"></path>
            <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z"></path>
            <path d="M9 14a5 5 0 0 0 6 0"></path>
          </svg>
          Enviar Relatório
        </Button>
      </PageHeader>
      
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
      
      <div className="flex flex-col md:flex-row items-stretch gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-md border-salon-secondary/50"
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
                  </>
                ) : (
                  format(date.from, "dd/MM/yyyy")
                )
              ) : (
                "Filtrar por Data"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={startDate}
              selected={date}
              onSelect={handleDateRangeSelect}
              numberOfMonths={2}
              locale={ptBR}
              className="border-0"
            />
            {date && (
              <div className="p-3 border-t flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setDate(undefined);
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                >
                  Limpar
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
      
      <Tabs value={tabValue} onValueChange={setTabValue}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="paid">Pagos</TabsTrigger>
        </TabsList>
        
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum registro encontrado</h3>
              <p className="text-muted-foreground text-center mt-2">
                {searchTerm || date ? 
                  "Tente ajustar os filtros para ver mais resultados." : 
                  "Este cliente ainda não possui histórico de atendimentos."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="p-4">
                <DataTable
                  data={appointments}
                  columns={appointmentColumns}
                  onRowClick={handleRowClick}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </Tabs>
      
      {selectedAppointment && (
        <DialogEditPayment
          appointment={selectedAppointment}
          open={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={handlePaymentUpdate}
        />
      )}
    </PageContainer>
  );
};

export default ClienteHistorico;
