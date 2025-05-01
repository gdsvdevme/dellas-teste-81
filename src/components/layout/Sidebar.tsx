
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
          className="bg-background rounded-full shadow-salon border-salon-secondary"
        >
          {isOpen ? (
            <X className="h-5 w-5 text-salon-primary" />
          ) : (
            <Menu className="h-5 w-5 text-salon-primary" />
          )}
        </Button>
      </div>

      {/* Sidebar backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 transform bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col",
          isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
        )}
      >
        <div className="flex h-24 items-center justify-center border-b border-sidebar-border bg-gradient-to-r from-salon-primary/10 to-salon-rose/10">
          <h1 className="font-playfair text-2xl font-bold salon-gradient-text">
            Dellas - Cabelo & Pele
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-5 space-y-2.5">
          {sidebarItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-4 rounded-xl px-4 py-3 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active
                    ? "bg-gradient-to-r from-salon-primary to-salon-primary text-white shadow-sm hover:from-salon-primary hover:to-salon-primary hover:text-white"
                    : "hover:translate-x-1"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="p-4 rounded-xl bg-gradient-to-br from-salon-primary/20 to-salon-rose/20 text-center">
            <p className="text-sm font-medium text-sidebar-foreground">
              Dellas - Cabelo & Pele
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Beleza & Bem-estar
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
