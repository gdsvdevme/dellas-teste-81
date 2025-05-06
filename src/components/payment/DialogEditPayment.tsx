
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define the expected appointment type
type Appointment = {
  id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  final_price: number | null;
  notes: string | null;
  client: {
    name: string;
    phone?: string;
  };
  appointment_services: {
    service: {
      name: string;
    };
  }[];
};

// Props for the dialog component
interface DialogEditPaymentProps {
  appointment: Appointment;
  open: boolean;
  onClose: () => void;
  onUpdate: (values: { status: string, payment_status: string, final_price: number, payment_method?: string }) => void;
}

// Form schema for validation
const formSchema = z.object({
  status: z.string(),
  payment_status: z.string(),
  payment_method: z.string().optional(),
  final_price: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().min(0, "O valor não pode ser negativo")
  ),
});

export function DialogEditPayment({
  appointment,
  open,
  onClose,
  onUpdate,
}: DialogEditPaymentProps) {
  // Initialize the form with current appointment values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: appointment.status,
      payment_status: appointment.payment_status === null ? "não definido" : 
                     appointment.payment_status === "undefined" ? "não definido" : 
                     appointment.payment_status === "paid" ? "pago" :
                     appointment.payment_status === "pending" ? "pendente" : "não definido",
      payment_method: appointment.payment_method || "dinheiro",
      final_price: appointment.final_price || 0,
    },
  });

  // Track form changes to ensure status and payment status consistency
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // If status changes, update payment_status accordingly
      if (name === "status") {
        const newStatus = value.status;
        if (newStatus === "agendado" || newStatus === "cancelado") {
          form.setValue("payment_status", "não definido");
        } else if (newStatus === "finalizado") {
          form.setValue("payment_status", "pago");
        } else if (newStatus === "pagamento pendente") {
          form.setValue("payment_status", "pendente");
        }
      }
      
      // If payment_status changes, update status accordingly
      if (name === "payment_status") {
        const newPaymentStatus = value.payment_status;
        if (newPaymentStatus === "pago") {
          form.setValue("status", "finalizado");
        } else if (newPaymentStatus === "pendente") {
          form.setValue("status", "pagamento pendente");
        } else if (newPaymentStatus === "não definido") {
          // Only reset status if it's payment-related
          const currentStatus = form.getValues("status");
          if (currentStatus === "finalizado" || currentStatus === "pagamento pendente") {
            form.setValue("status", "agendado");
          }
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Generate WhatsApp link for sending receipt
  const getWhatsAppLink = () => {
    if (!appointment.client?.phone) return null;
    
    const serviceNames = appointment.appointment_services?.map(as => as.service?.name).join(", ") || "Serviço";
    const date = format(new Date(appointment.start_time), "dd/MM/yyyy");
    const amount = appointment.final_price?.toFixed(2);
    const paymentMethod = form.getValues("payment_method");

    const text = encodeURIComponent(
      `Olá ${appointment.client.name}, confirmamos o pagamento do serviço: ${serviceNames} realizado em ${date} no valor de R$ ${amount}. ` +
      `Método de pagamento: ${paymentMethod}. Obrigado!`
    );
    
    return `https://wa.me/55${appointment.client.phone.replace(/\D/g, '')}?text=${text}`;
  };

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Map UI values to database values
    const dbStatus = values.status;
    let dbPaymentStatus = values.payment_status;
    
    // Map "não definido" to "undefined" for the database
    if (values.payment_status === "não definido") {
      dbPaymentStatus = "undefined";
    } else if (values.payment_status === "pago") {
      dbPaymentStatus = "paid";
    } else if (values.payment_status === "pendente") {
      dbPaymentStatus = "pending";
    }
    
    // Ensure we're passing the required properties with non-optional values
    onUpdate({
      status: dbStatus,
      payment_status: dbPaymentStatus,
      final_price: values.final_price,
      payment_method: values.payment_method
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-lg overflow-y-auto max-h-[85vh] p-0">
        <DialogHeader className="bg-gradient-to-r from-salon-primary/90 to-salon-primary p-4 sm:p-6 rounded-t-lg sticky top-0 z-[55]">
          <DialogTitle className="text-white">Editar Pagamento</DialogTitle>
          <DialogDescription className="text-white/80">
            Cliente: {appointment.client?.name}
            {appointment.client?.phone && (
              <>
                <br />
                Telefone: {appointment.client.phone}
              </>
            )}
            <br />
            Data: {format(new Date(appointment.start_time), "dd/MM/yyyy HH:mm")}
            <br />
            Serviço: {appointment.appointment_services?.map(as => as.service?.name).join(", ") || "Não especificado"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Agendamento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-md border-salon-secondary/50">
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-md border-salon-secondary/30 z-[75]">
                        <SelectItem value="agendado">Agendado</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                        <SelectItem value="pagamento pendente">Pagamento Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Pagamento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-md border-salon-secondary/50">
                          <SelectValue placeholder="Selecione um status de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-md border-salon-secondary/30 z-[75]">
                        <SelectItem value="não definido">Não definido</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="final_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="rounded-md border-salon-secondary/50"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pagamento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || "dinheiro"}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-md border-salon-secondary/50">
                          <SelectValue placeholder="Selecione o método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-md border-salon-secondary/30 z-[75]">
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-2 flex gap-2 justify-end">
              {appointment.client?.phone && appointment.payment_status === "pago" && (
                <a
                  href={getWhatsAppLink() || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium border"
                >
                  Enviar Comprovante (WhatsApp)
                </a>
              )}
              <Button type="button" variant="outline" onClick={onClose} className="rounded-md">Cancelar</Button>
              <Button type="submit" variant="salon">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
