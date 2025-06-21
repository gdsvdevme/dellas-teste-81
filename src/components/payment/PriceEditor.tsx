
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceEditorProps {
  value: number;
  onSave: (newValue: number) => void;
  onCancel?: () => void;
  isEditing?: boolean;
  onEditToggle?: () => void;
  disabled?: boolean;
  className?: string;
}

const PriceEditor: React.FC<PriceEditorProps> = ({
  value,
  onSave,
  onCancel,
  isEditing = false,
  onEditToggle,
  disabled = false,
  className
}) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setInputValue(value.toString());
    setHasError(false);
  }, [value, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Validação básica
    const numValue = parseFloat(newValue);
    setHasError(isNaN(numValue) || numValue < 0);
  };

  const handleSave = () => {
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onSave(numValue);
      setHasError(false);
    } else {
      setHasError(true);
    }
  };

  const handleCancel = () => {
    setInputValue(value.toString());
    setHasError(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative">
          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
            R$
          </span>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-28 pl-8 h-8 text-sm",
              hasError && "border-destructive focus:border-destructive"
            )}
            placeholder="0.00"
            autoFocus
          />
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={handleSave}
          disabled={hasError}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleCancel}
        >
          <X className="h-4 w-4" />
        </Button>
        {hasError && (
          <span className="text-xs text-destructive">Valor inválido</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="font-medium text-lg text-salon-primary">
        R$ {value.toFixed(2)}
      </span>
      {onEditToggle && !disabled && (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
          onClick={onEditToggle}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default PriceEditor;
