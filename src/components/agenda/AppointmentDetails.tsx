
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Calendar as CalendarIcon, Trash2, Pencil, Repeat, Phone } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { appointmentStatusMap, getDisplayStatus } from "./AgendaUtils";
import AppointmentModal from "./AppointmentModal";
import { useAppointmentDelete } from "./hooks/useAppointmentDelete";
import { Progress } from "@/components/ui/progress";
import AppointmentActions from "./AppointmentActions";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  clients?: { name: string; phone?: string } | null;
  appointment_services?: Array<{
    service_id: string;
    services: { name: string; duration: number };
    final_price: number;
  }> | null;
  is_parent?: boolean;
  parent_appointment_id?: string | null;
};

interface AppointmentDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
}

export const isRecurringAppointment = (appointment: Appointment | null): boolean => {
  if (!appointment) return false;
  
  // An appointment is recurring if:
  // 1. It has recurrence settings and is a parent
  // 2. Or it has a parent_appointment_id
  return (!!appointment.recurrence && 
         appointment.recurrence !== 'none' && 
         (appointment.is_parent || false)) ||
         !!appointment.parent_appointment_id;
};

const AppointmentDetails = ({ 
  open, 
  onOpenChange, 
  appointment, 
  onSuccess 
}: AppointmentDetailsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurrenceDeleteDialogOpen, setIsRecurrenceDeleteDialogOpen] = useState(false);
  const [deleteOption, setDeleteOption] = useState<string>("single");
  
  const { 
    isDeleting, 
    progress, 
    deleteSingleAppointment, 
    deleteFutureRecurringAppointments,
    deleteAllRecurringAppointments 
  } = useAppointmentDelete({
    onSuccess: () => {
      onOpenChange(false);
      if (onSuccess) onSuccess();
    }
  });

  if (!appointment) return null;

  const startTime = new Date(appointment.start_time);
  const endTime = new Date(appointment.end_time);
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // in minutes
  
  const isRecurring = isRecurringAppointment(appointment);
  const isParent = appointment.is_parent || false;
  const hasParent = !!appointment.parent_appointment_id;
  const isPastAppointment = new Date() > startTime;
  const isCompletedOrPaid = appointment.status === "finalizado" || appointment.payment_status === "pago";

  const displayStatus = getDisplayStatus(appointment.status);
  const statusConfig = appointmentStatusMap[displayStatus];
  const StatusIcon = statusConfig?.icon;
  
  // Format payment status
  let paymentStatus = "Não definido";
  if (appointment.payment_status === "paid") {
    paymentStatus = "Pago";
  } else if (appointment.payment_status === "pending") {
    paymentStatus = "Pendente";
  }
  
  // Get services
  const services = appointment.appointment_services?.map(as => ({
    name: as.services.name,
    price: as.final_price,
    duration: as.services.duration
  })) || [];
  
  // Calculate total price
  const totalPrice = services.reduce((total, service) => total + service.price, 0);

  const handleRecurringDelete = async () => {
    if (deleteOption === "single") {
      await deleteSingleAppointment(appointment.id);
    } else if (deleteOption === "future") {
      await deleteFutureRecurringAppointments(appointment);
    } else if (deleteOption === "all") {
      await deleteAllRecurringAppointments(appointment);
    }
    setIsRecurrenceDeleteDialogOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            {/* Status */}
            <div className="flex justify-between items-center">
              <StatusBadge 
                variant={statusConfig?.badgeVariant || "default"}
                className="flex items-center gap-1.5"
              >
                {StatusIcon && <StatusIcon className="h-4 w-4" />}
                {statusConfig?.label}
              </StatusBadge>
              
              {isRecurring && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  <Repeat className="h-3 w-3 mr-1" />
                  {isParent ? "Recorrência Principal" : "Parte de Recorrência"}
                </span>
              )}
            </div>
            
            {/* Client */}
            <div>
              <h3 className="text-lg font-medium">{appointment.clients?.name}</h3>
              {appointment.clients?.phone && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                  <Phone className="h-4 w-4" />
                  <span>{appointment.clients.phone}</span>
                </div>
              )}
            </div>
            
            {/* Date and time */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4" />
              <span>{format(startTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>
                {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")} ({duration} min)
              </span>
            </div>
            
            {/* Services */}
            <div className="pt-3">
              <h4 className="text-sm font-medium mb-2">Serviços:</h4>
              <ul className="space-y-2">
                {services.map((service, index) => (
                  <li key={index} className="flex justify-between text-sm">
                    <span>{service.name} ({service.duration} min)</span>
                    <span className="font-medium">R$ {service.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Total */}
            <div className="pt-2 border-t">
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>R$ {totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Pagamento:</span>
                <span>{paymentStatus}</span>
              </div>
            </div>
            
            {/* Notes */}
            {appointment.notes && (
              <div className="pt-3">
                <h4 className="text-sm font-medium mb-1">Observações:</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{appointment.notes}</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-3 border-t">
              <h4 className="text-sm font-medium mb-2">Ações Rápidas:</h4>
              <AppointmentActions 
                appointmentId={appointment.id}
                currentStatus={appointment.status}
                onSuccess={() => {
                  if (onSuccess) onSuccess();
                  onOpenChange(false);
                }}
                size="default"
                variant="full"
              />
            </div>

            {/* Progress bar for deletion process */}
            {isDeleting && (
              <div className="pt-2">
                <div className="text-sm text-gray-500 mb-2">
                  {progress < 100 ? 'Excluindo agendamento...' : 'Concluído!'}
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setIsModalOpen(true)}
                disabled={isDeleting}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              
              {isRecurring ? (
                <AlertDialog open={isRecurrenceDeleteDialogOpen} onOpenChange={setIsRecurrenceDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Agendamento Recorrente</AlertDialogTitle>
                      <AlertDialogDescription>
                        Este é um agendamento {isParent ? "principal" : "parte"} de uma série recorrente. 
                        Escolha como deseja proceder:
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="my-4">
                      <RadioGroup value={deleteOption} onValueChange={setDeleteOption}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="single" id="single" />
                          <Label htmlFor="single" className="text-sm">
                            Excluir apenas este agendamento
                          </Label>
                        </div>
                        
                        {!isPastAppointment && (
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="future" id="future" />
                            <Label htmlFor="future" className="text-sm">
                              Excluir este e todos os futuros agendamentos
                              <span className="text-xs text-gray-500 block">
                                (preserva agendamentos passados)
                              </span>
                            </Label>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="all" />
                          <Label htmlFor="all" className="text-sm">
                            Excluir toda a série de agendamentos
                            {isCompletedOrPaid && (
                              <span className="text-xs text-red-500 block">
                                ⚠️ Inclui agendamentos já finalizados/pagos
                              </span>
                            )}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleRecurringDelete}
                        disabled={isDeleting}
                      >
                        Confirmar Exclusão
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Agendamento</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir este agendamento?
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteSingleAppointment(appointment.id)}
                        disabled={isDeleting}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit modal */}
      <AppointmentModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        appointment={appointment}
        onSuccess={onSuccess}
      />
    </>
  );
};

export default AppointmentDetails;
