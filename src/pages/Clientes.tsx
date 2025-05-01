
import { useState } from "react";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { DataTable } from "@/components/ui/data-table";
import ClientDialog from "@/components/clients/ClientDialog";

const Clientes = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  // Buscar clientes do Supabase
  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");

      if (error) {
        console.error("Erro ao carregar clientes:", error);
        return [];
      }
      return data || [];
    }
  });

  // Abrir o diálogo para editar um cliente
  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  // Abrir o diálogo para adicionar um novo cliente
  const handleAddClient = () => {
    setEditingClient(null);
    setIsDialogOpen(true);
  };

  // Colunas da tabela de clientes
  const columns = [
    {
      header: "Nome",
      accessorKey: "name",
    },
    {
      header: "Telefone",
      accessorKey: "phone",
      cell: ({ row }: { row: { original: any } }) => (
        <span>{row.original.phone || "Não informado"}</span>
      ),
    },
    {
      header: "Data de Cadastro",
      accessorKey: "created_at",
      cell: ({ row }: { row: { original: any } }) => (
        <span>
          {row.original.created_at
            ? new Date(row.original.created_at).toLocaleDateString("pt-BR")
            : ""}
        </span>
      ),
    },
    {
      header: "Ações",
      accessorKey: (row: any) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClient(row);
            }}
          >
            Editar
          </Button>
        </div>
      ),
    },
  ];

  // Após sucesso na adição ou edição de um cliente, atualizar a lista
  const handleSuccess = () => {
    refetch();
    setIsDialogOpen(false);
  };

  return (
    <PageContainer>
      <PageHeader title="Clientes" subtitle="Gerencie seus clientes">
        <Button onClick={handleAddClient} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-salon-primary"></div>
            </div>
          ) : (
            <div className="p-4">
              <DataTable
                data={clients || []}
                columns={columns}
                searchField="name"
                pageSize={10}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ClientDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        client={editingClient} 
        onSuccess={handleSuccess} 
      />
    </PageContainer>
  );
};

export default Clientes;
