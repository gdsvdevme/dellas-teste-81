
import React from "react";

type PageContainerProps = {
  children: React.ReactNode;
};

const PageContainer = ({ children }: PageContainerProps) => {
  return (
    <div className="flex-1 p-5 lg:p-8 transition-all duration-300">
      <div className="mx-auto max-w-7xl">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-salon p-6 border border-salon-secondary/20">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageContainer;
