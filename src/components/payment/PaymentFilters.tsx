import React, { useState } from "react";
import { CalendarIcon, FilterIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface PaymentFiltersProps {
  onFilterChange: (filters: PaymentFilters) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export interface PaymentFilters {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  paymentMethod: string | null;
  minAmount: number | null;
  maxAmount: number | null;
  serviceType: string | null;
}

const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  onFilterChange,
  onClearFilters,
  activeFilterCount
}) => {
  const [filters, setFilters] = useState<PaymentFilters>({
    dateRange: { from: null, to: null },
    paymentMethod: null,
    minAmount: null,
    maxAmount: null,
    serviceType: null
  });

  const [isOpen, setIsOpen] = useState(false);

  // Handle filter changes
  const handleFilterChange = (key: keyof PaymentFilters, value: any) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  // Handle date range selection
  const handleDateRangeChange = (field: 'from' | 'to', value: Date | null) => {
    const updatedDateRange = { ...filters.dateRange, [field]: value };
    handleFilterChange('dateRange', updatedDateRange);
  };

  // Handle amount range
  const handleAmountChange = (field: 'minAmount' | 'maxAmount', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    handleFilterChange(field, numValue);
  };

  // Clear all filters
  const handleClearFilters = () => {
    const emptyFilters = {
      dateRange: { from: null, to: null },
      paymentMethod: null,
      minAmount: null,
      maxAmount: null,
      serviceType: null
    };
    setFilters(emptyFilters);
    onClearFilters();
    setIsOpen(false);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 gap-1">
              <FilterIcon className="h-4 w-4" />
              <span>Filtros</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-salon-primary w-5 h-5 text-xs flex items-center justify-center text-white font-medium">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              <h4 className="font-medium">Filtrar pagamentos</h4>
              
              {/* Date range filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-9"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.from ? (
                          format(filters.dateRange.from, "dd/MM/yyyy")
                        ) : (
                          <span>De</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.from || undefined}
                        onSelect={(date) => handleDateRangeChange('from', date)}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-9"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.to ? (
                          format(filters.dateRange.to, "dd/MM/yyyy")
                        ) : (
                          <span>Até</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.to || undefined}
                        onSelect={(date) => handleDateRangeChange('to', date)}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Payment method filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Método de Pagamento</label>
                <Select
                  value={filters.paymentMethod || ""}
                  onValueChange={(value) => handleFilterChange('paymentMethod', value || null)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione um método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mínimo"
                    className="h-9"
                    value={filters.minAmount !== null ? filters.minAmount : ''}
                    onChange={(e) => handleAmountChange('minAmount', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Máximo"
                    className="h-9"
                    value={filters.maxAmount !== null ? filters.maxAmount : ''}
                    onChange={(e) => handleAmountChange('maxAmount', e.target.value)}
                  />
                </div>
              </div>

              {/* Service type filter - could be populated from actual services */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Serviço</label>
                <Select
                  value={filters.serviceType || ""}
                  onValueChange={(value) => handleFilterChange('serviceType', value || null)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="corte">Corte</SelectItem>
                    <SelectItem value="coloracao">Coloração</SelectItem>
                    <SelectItem value="manicure">Manicure</SelectItem>
                    <SelectItem value="pedicure">Pedicure</SelectItem>
                    <SelectItem value="depilacao">Depilação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Limpar filtros
                </Button>
                <Button size="sm" onClick={() => setIsOpen(false)}>
                  Aplicar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Quick filters */}
        <Select
          value={filters.paymentMethod || ""}
          onValueChange={(value) => handleFilterChange('paymentMethod', value || null)}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Método de pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os métodos</SelectItem>
            <SelectItem value="dinheiro">Dinheiro</SelectItem>
            <SelectItem value="cartao">Cartão</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
          </SelectContent>
        </Select>

        {/* Period quick filter */}
        <Select
          value={filters.dateRange.from && filters.dateRange.to ? "custom" : ""}
          onValueChange={(value) => {
            const today = new Date();
            let from = null;
            let to = new Date();
            
            if (value === "today") {
              from = today;
            } else if (value === "week") {
              from = new Date();
              from.setDate(today.getDate() - 7);
            } else if (value === "month") {
              from = new Date();
              from.setMonth(today.getMonth() - 1);
            } else if (value === "custom") {
              // Do nothing, keep the current custom values
              return;
            } else {
              // Reset date range
              to = null;
            }
            
            handleFilterChange('dateRange', { from, to });
          }}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os períodos</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mês</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {/* Show active filters and clear button */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9">
            <X className="mr-2 h-4 w-4" />
            Limpar filtros ({activeFilterCount})
          </Button>
        )}
      </div>
    </div>
  );
};

export default PaymentFilters;
