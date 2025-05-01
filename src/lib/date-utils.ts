
import { addDays, addWeeks, addMonths, setDay, format, parse, isSameDay } from "date-fns";
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
  if (!recurrence || recurrenceCount <= 1 || recurrenceDays.length === 0) {
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
  
  // Para cada ocorrência de recorrência
  for (let i = 0; i < recurrenceCount; i++) {
    // Tratamento especial para a primeira ocorrência (primeira semana/mês)
    if (i === 0) {
      // Para a primeira ocorrência, apenas adicionamos os outros dias da mesma semana/mês
      // que são diferentes do dia da data base
      for (const dayName of recurrenceDays) {
        const targetDayIndex = weekdayNameToIndex[dayName as keyof typeof weekdayNameToIndex];
        
        if (targetDayIndex === undefined) continue;
        
        // Pula se for o mesmo dia da semana da data base
        if (targetDayIndex === baseDayOfWeek) continue;
        
        // Para o primeiro período (i=0), não aplicamos a função addInterval
        // pois queremos os dias da mesma semana/mês
        let dayInSameWeek = new Date(baseDateObj);
        
        // Calculamos quantos dias precisamos adicionar para chegar ao dia desejado
        // na mesma semana/mês
        const daysToAdd = (targetDayIndex - baseDayOfWeek + 7) % 7;
        dayInSameWeek = addDays(dayInSameWeek, daysToAdd);
        
        // Se for recorrência mensal, precisamos verificar se não ultrapassa o mês
        if (recurrence === "monthly" && dayInSameWeek.getMonth() !== baseDateObj.getMonth()) {
          continue;
        }
        
        // Adicionamos a hora original à nova data
        dayInSameWeek.setHours(
          baseDateObj.getHours(),
          baseDateObj.getMinutes(),
          0,
          0
        );
        
        futureDates.push(dayInSameWeek);
      }
    } else {
      // Para as ocorrências seguintes (i > 0), mantemos a lógica original
      // mas precisamos garantir que todas as datas sejam adicionadas
      for (const dayName of recurrenceDays) {
        const targetDayIndex = weekdayNameToIndex[dayName as keyof typeof weekdayNameToIndex];
        
        if (targetDayIndex === undefined) continue;
        
        // Calculamos a próxima data baseada na recorrência
        let nextDate = addInterval(baseDateObj, i);
        
        // Ajustamos para o dia da semana correto
        if (recurrence === "monthly") {
          // Para recorrência mensal, ajustamos para o dia correspondente no mês
          // mas mantemos o mesmo dia do mês (ou próximo válido)
          // Este é um comportamento simplificado, pode precisar ser melhorado
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
  }

  return futureDates;
}

/**
 * Formata uma data para exibição amigável em português
 */
export function formatDatePtBr(date: Date): string {
  return format(date, "PPP", { locale: ptBR });
}
