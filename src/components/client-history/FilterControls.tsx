
import { useState } from "react";
import { Calendar, Search } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface FilterControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  setStartDate: (date: Date | undefined) => void;
  setEndDate: (date: Date | undefined) => void;
  startDate?: Date;
}

export const FilterControls = ({
  searchTerm,
  setSearchTerm,
  date,
  setDate,
  setStartDate,
  setEndDate,
  startDate,
}: FilterControlsProps) => {
  
  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDate(range);
    setStartDate(range?.from);
    setEndDate(range?.to);
  };

  return (
    <div className="flex flex-col md:flex-row items-stretch gap-4 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por serviço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-md border-salon-secondary/50"
        />
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy")
              )
            ) : (
              "Filtrar por Data"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={startDate}
            selected={date}
            onSelect={handleDateRangeSelect}
            numberOfMonths={2}
            locale={ptBR}
            className="border-0"
          />
          {date && (
            <div className="p-3 border-t flex justify-end">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setDate(undefined);
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
              >
                Limpar
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
