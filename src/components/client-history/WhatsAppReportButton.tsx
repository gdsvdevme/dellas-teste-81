
import { Button } from "@/components/ui/button";
import { AppointmentWithServices } from "@/hooks/useClientHistory";

interface WhatsAppReportButtonProps {
  sendWhatsAppReport: (appointments: AppointmentWithServices[]) => void;
  paidAppointments: AppointmentWithServices[];
}

export const WhatsAppReportButton = ({ 
  sendWhatsAppReport, 
  paidAppointments 
}: WhatsAppReportButtonProps) => {
  return (
    <Button 
      onClick={() => sendWhatsAppReport(paidAppointments)}
      className="flex items-center gap-2"
      variant="salon"
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
  );
};
