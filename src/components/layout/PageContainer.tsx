
import React from "react";

type PageContainerProps = {
  children: React.ReactNode;
};

const PageContainer = ({ children }: PageContainerProps) => {
  return (
    <div className="flex-1 p-4 lg:p-8 md:ml-64">
      <div className="mx-auto max-w-7xl">{children}</div>
    </div>
  );
};

export default PageContainer;
