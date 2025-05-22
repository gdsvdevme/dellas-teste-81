
import React from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  highlightedAmount?: {
    label: string;
    amount: number;
  };
};

const PageHeader = ({ title, subtitle, children, highlightedAmount }: PageHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 mb-6 border-b border-salon-secondary/30 pb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl md:text-3xl font-semibold tracking-tight text-salon-primary">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {children && <div className="flex-shrink-0">{children}</div>}
      </div>
      
      {highlightedAmount && (
        <div className="bg-salon-primary/10 rounded-md p-4 flex justify-between items-center">
          <span className="text-salon-primary font-medium">{highlightedAmount.label}</span>
          <span className="text-salon-primary text-xl font-semibold">
            R$ {highlightedAmount.amount.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};

export default PageHeader;
