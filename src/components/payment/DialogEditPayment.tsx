
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
  onUpdate: (values: { status: string, payment_status: string, final_price: number }) => void;
}

// Form schema for validation
const formSchema = z.object({
  status: z.string(),
  payment_status: z.string(),
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
      payment_status: appointment.payment_status || "não definido",
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

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Ensure we're passing the required properties with non-optional values
    onUpdate({
      status: values.status,
      payment_status: values.payment_status === "não definido" ? null : values.payment_status,
      final_price: values.final_price,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-lg p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-salon-primary/90 to-salon-primary p-5 rounded-t-lg">
          <DialogTitle className="text-white">Editar Pagamento</DialogTitle>
          <DialogDescription className="text-white/80">
            Cliente: {appointment.client?.name}
            <br />
            Data: {format(new Date(appointment.start_time), "dd/MM/yyyy HH:mm")}
            <br />
            Serviço: {appointment.appointment_services?.map(as => as.service?.name).join(", ") || "Não especificado"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-5">
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
                    <SelectContent className="rounded-md border-salon-secondary/30">
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
                    <SelectContent className="rounded-md border-salon-secondary/30">
                      <SelectItem value="não definido">Não definido</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <DialogFooter className="pt-2 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-md">Cancelar</Button>
              <Button type="submit" variant="salon">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
