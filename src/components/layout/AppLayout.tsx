
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen pt-16 lg:pt-0">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
};

export default AppLayout;
