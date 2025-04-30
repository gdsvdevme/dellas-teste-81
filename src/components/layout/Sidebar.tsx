
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  PackageOpen,
  DollarSign,
  CreditCard,
  FileText,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarItem = {
  icon: React.ElementType;
  label: string;
  path: string;
};

const sidebarItems: SidebarItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
  },
  {
    icon: Calendar,
    label: "Agenda",
    path: "/agenda",
  },
  {
    icon: Users,
    label: "Clientes",
    path: "/clientes",
  },
  {
    icon: Scissors,
    label: "Serviços",
    path: "/servicos",
  },
  {
    icon: PackageOpen,
    label: "Estoque",
    path: "/estoque",
  },
  {
    icon: DollarSign,
    label: "Finanças",
    path: "/financas",
  },
  {
    icon: CreditCard,
    label: "Pagamentos",
    path: "/pagamentos",
  },
  {
    icon: FileText,
    label: "Relatórios",
    path: "/relatorios",
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/configuracoes",
  },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Função para determinar se um item está ativo
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile menu toggle button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="bg-background"
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
          <h1 className="text-xl font-semibold text-sidebar-foreground">
            Dellas - Cabelo & Pele
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {sidebarItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active &&
                    "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
