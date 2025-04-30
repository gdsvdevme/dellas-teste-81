
import React from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

const PageHeader = ({ title, subtitle, children }: PageHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
};

export default PageHeader;
