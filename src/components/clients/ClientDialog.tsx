
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Esquema de validação do formulário
const clientSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: { id: string; name: string; phone?: string } | null;
  onSuccess?: () => void;
}

const ClientDialog = ({
  open,
  onOpenChange,
  client,
  onSuccess,
}: ClientDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Inicializar o formulário
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || "",
      phone: client?.phone || "",
    },
  });

  // Atualizar valores quando o cliente mudar
  useState(() => {
    if (client) {
      form.reset({
        name: client.name,
        phone: client.phone || "",
      });
    } else {
      form.reset({
        name: "",
        phone: "",
      });
    }
  });

  // Enviar o formulário
  const onSubmit = async (values: ClientFormValues) => {
    setSubmitting(true);

    try {
      if (client) {
        // Atualizar cliente existente
        const { error } = await supabase
          .from("clients")
          .update({
            name: values.name,
            phone: values.phone,
          })
          .eq("id", client.id);

        if (error) throw error;

        toast({
          title: "Cliente atualizado",
          description: "As informações do cliente foram atualizadas com sucesso.",
        });
      } else {
        // Criar novo cliente
        const { error } = await supabase
          .from("clients")
          .insert({
            name: values.name,
            phone: values.phone,
          });

        if (error) throw error;

        toast({
          title: "Cliente cadastrado",
          description: "O cliente foi cadastrado com sucesso.",
        });
      }

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar cliente:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o cliente",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-md">
        <DialogHeader>
          <DialogTitle>
            {client ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="Telefone do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                    Salvando...
                  </div>
                ) : client ? (
                  "Salvar"
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDialog;
