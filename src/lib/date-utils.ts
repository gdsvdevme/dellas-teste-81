
import { addDays, addWeeks, addMonths, setDay, format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Mapeia os nomes dos dias da semana em português para seus índices numéricos
 * Domingo = 0, Segunda = 1, ..., Sábado = 6
 */
export const weekdayNameToIndex = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6
};

/**
 * Calcula as datas futuras com base nas configurações de recorrência
 * @param baseDate Data inicial do agendamento
 * @param recurrence Tipo de recorrência ('weekly', 'biweekly', 'monthly')
 * @param recurrenceDays Array com os dias da semana selecionados
 * @param recurrenceCount Número de ocorrências
 * @returns Array com as datas futuras calculadas
 */
export function calculateRecurrenceDates(
  baseDate: Date,
  recurrence: "weekly" | "biweekly" | "monthly" | null,
  recurrenceDays: string[],
  recurrenceCount: number
): Date[] {
  if (!recurrence || recurrence === "none" || recurrenceCount <= 1 || recurrenceDays.length === 0) {
    return [];
  }

  const futureDates: Date[] = [];
  const baseDateObj = new Date(baseDate);
  
  // Obtém o dia da semana da data base (0-6)
  const baseDayOfWeek = baseDateObj.getDay();

  // Define a função para adicionar o intervalo apropriado
  const addInterval = (date: Date, index: number) => {
    switch (recurrence) {
      case "weekly":
        return addWeeks(date, index);
      case "biweekly":
        return addWeeks(date, index * 2);
      case "monthly":
        return addMonths(date, index);
      default:
        return date;
    }
  };

  // Para cada dia selecionado na recorrência
  for (let i = 0; i < recurrenceCount; i++) {
    // Não incluímos a primeira ocorrência, pois ela já está sendo criada como agendamento principal
    if (i === 0) continue;
    
    for (const dayName of recurrenceDays) {
      const targetDayIndex = weekdayNameToIndex[dayName as keyof typeof weekdayNameToIndex];
      
      if (targetDayIndex === undefined) continue;
      
      // Calculamos a próxima data baseada na recorrência
      let nextDate = addInterval(baseDateObj, i);
      
      // Ajustamos para o dia da semana correto
      if (recurrence === "monthly") {
        // Para recorrência mensal, mantemos o mesmo dia do mês
        // e apenas ajustamos o mês
      } else {
        // Para recorrências semanais/quinzenais, ajustamos o dia da semana
        const daysToAdd = (targetDayIndex - baseDayOfWeek + 7) % 7;
        nextDate = addDays(nextDate, daysToAdd);
      }
      
      // Adicionamos a hora original à nova data
      nextDate.setHours(
        baseDateObj.getHours(),
        baseDateObj.getMinutes(),
        0,
        0
      );
      
      futureDates.push(nextDate);
    }
  }

  return futureDates;
}

/**
 * Formata uma data para exibição amigável em português
 */
export function formatDatePtBr(date: Date): string {
  return format(date, "PPP", { locale: ptBR });
}
