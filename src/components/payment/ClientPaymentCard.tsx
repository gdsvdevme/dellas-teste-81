
import React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Appointment } from "./PendingPaymentsByClient";

interface ClientPaymentCardProps {
  clientId: string;
  clientName: string;
  clientPhone?: string;
  appointments: Appointment[];
  totalDue: number;
  isOpen: boolean;
  onToggleOpen: () => void;
  onPayment: (appointment: Appointment, method?: string) => void;
  onPayAll: (clientId: string, appointments: Appointment[], method?: string) => void;
  onEdit: (appointment: Appointment) => void;
  selectedIds: string[];
  onToggleSelect: (id: string, isSelected: boolean) => void;
  onUpdatePrice: (appointmentId: string, newPrice: number) => void;
  onPaySelected?: (appointments: Appointment[], method?: string) => void;
}

const ClientPaymentCard: React.FC<ClientPaymentCardProps> = ({
  clientId,
  clientName,
  clientPhone,
  appointments,
  totalDue,
  onToggleOpen
}) => {
  return (
    <Link to={`/pagamentos/cliente/${clientId}`}>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:bg-salon-secondary/5">
        <CardHeader className="p-4 cursor-pointer bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-lg font-medium">{clientName}</h3>
                <div className="flex flex-col text-sm">
                  <p className="text-muted-foreground">
                    {appointments.length} {appointments.length === 1 ? 'serviço pendente' : 'serviços pendentes'}
                  </p>
                  {clientPhone && (
                    <p className="text-muted-foreground">
                      📱 {clientPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="font-medium text-lg">
                  R$ {totalDue.toFixed(2)}
                </span>
              </div>
              <ArrowRight className="h-5 w-5 text-salon-primary" />
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
};

export default ClientPaymentCard;
