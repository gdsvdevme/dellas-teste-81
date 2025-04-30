
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Formatar data e hora
export const formatDateTime = (date: string | Date, formatStr: string = "PPp") => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: ptBR });
};

// Status de agendamento
export const appointmentStatusMap = {
  scheduled: {
    label: "Agendado",
    color: "bg-blue-50 border-blue-500 text-blue-700",
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-50 border-red-500 text-red-700",
  },
  completed: {
    label: "Finalizado",
    color: "bg-green-50 border-green-500 text-green-700",
  },
  pendingPayment: {
    label: "Pagamento Pendente",
    color: "bg-yellow-50 border-yellow-500 text-yellow-700",
  },
};

// Status de pagamento
export const paymentStatusMap = {
  pending: {
    label: "Pendente",
    color: "bg-yellow-50 border-yellow-500 text-yellow-700",
  },
  paid: {
    label: "Pago",
    color: "bg-green-50 border-green-500 text-green-700",
  },
};

// Recorrência de agendamento
export const recurrenceMap = {
  none: {
    label: "Sem recorrência",
  },
  weekly: {
    label: "Semanal",
  },
  biweekly: {
    label: "Quinzenal",
  },
  monthly: {
    label: "Mensal",
  },
};

// Função para calcular o preço total dos serviços
export const calculateTotalPrice = (services: any[]) => {
  return services.reduce((total, service) => total + (service.price || 0), 0);
};

// Formatar duração em horas e minutos
export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} minutos`;
  } else if (mins === 0) {
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  } else {
    return `${hours} hora${hours > 1 ? 's' : ''} e ${mins} minutos`;
  }
};
