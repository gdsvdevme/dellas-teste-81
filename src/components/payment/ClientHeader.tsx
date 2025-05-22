
import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

type ClientHeaderProps = {
  clientName: string;
  clientPhone?: string;
  appointmentsCount: number;
  totalDue: number;
};

const ClientHeader: React.FC<ClientHeaderProps> = ({
  clientName,
  clientPhone,
  appointmentsCount,
  totalDue,
}) => {
  return (
    <>
      <div className="mb-6">
        <Link to="/pagamentos">
          <Button variant="outline" className="flex items-center gap-2">
            <ChevronLeft size={16} /> Voltar para Pagamentos
          </Button>
        </Link>
      </div>

      <PageHeader
        title={clientName}
        subtitle={clientPhone ? `📱 ${clientPhone}` : undefined}
        highlightedAmount={{
          label: `${appointmentsCount} ${appointmentsCount === 1 ? 'serviço pendente' : 'serviços pendentes'}`,
          amount: totalDue
        }}
      />
    </>
  );
};

export default ClientHeader;
