
import { createI18n } from 'next-i18n';

export const i18n = {
  // Mensagens de sistema
  system: {
    loading: 'Carregando...',
    error: 'Ocorreu um erro',
    success: 'Operação realizada com sucesso',
    confirmDelete: 'Tem certeza que deseja excluir?',
    yes: 'Sim',
    no: 'Não',
    save: 'Salvar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Excluir',
    search: 'Buscar',
    noResults: 'Nenhum resultado encontrado',
    goBack: 'Voltar',
  },
  // Mensagens de autenticação
  auth: {
    login: 'Entrar',
    logout: 'Sair',
    email: 'E-mail',
    password: 'Senha',
    forgotPassword: 'Esqueceu a senha?',
    invalidCredentials: 'E-mail ou senha inválidos',
  },
  // Termos comuns da aplicação
  common: {
    dashboard: 'Dashboard',
    agenda: 'Agenda',
    clients: 'Clientes',
    services: 'Serviços',
    inventory: 'Estoque',
    finances: 'Finanças',
    payments: 'Pagamentos',
    reports: 'Relatórios',
    settings: 'Configurações',
    calendar: 'Calendário',
    today: 'Hoje',
    total: 'Total',
    status: 'Status',
    actions: 'Ações',
    name: 'Nome',
    phone: 'Telefone',
    email: 'E-mail',
    price: 'Preço',
    duration: 'Duração',
    description: 'Descrição',
    quantity: 'Quantidade',
    category: 'Categoria',
    date: 'Data',
    time: 'Horário',
    client: 'Cliente',
    service: 'Serviço',
    value: 'Valor',
    filter: 'Filtrar',
    from: 'De',
    to: 'Até',
    all: 'Todos',
  },
  // Status dos agendamentos
  appointmentStatus: {
    scheduled: 'Agendado',
    cancelled: 'Cancelado',
    completed: 'Finalizado',
    pendingPayment: 'Pagamento Pendente',
  },
  // Status dos pagamentos
  paymentStatus: {
    paid: 'Pago',
    pending: 'Pendente',
  },
};
