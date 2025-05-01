
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey: keyof T | ((row: T) => React.ReactNode);
    cell?: (info: any) => React.ReactNode;
  }[];
  searchField?: keyof T | ((row: T) => string);
  pageSize?: number;
}

export function DataTable<T>({
  data,
  columns,
  searchField,
  pageSize = 10,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter data based on search
  const filteredData = searchField
    ? data.filter((item) => {
        if (!item) return false;
        
        let fieldValue: any;
        
        // Handle function-based searchFields
        if (typeof searchField === 'function') {
          fieldValue = searchField(item);
        } else {
          // Handle nested properties using dot notation (e.g., 'client.name')
          const fieldPath = String(searchField).split('.');
          fieldValue = item;
          
          for (const path of fieldPath) {
            if (!fieldValue) return false;
            fieldValue = fieldValue[path as keyof typeof fieldValue];
          }
        }
        
        return fieldValue && String(fieldValue).toLowerCase().includes(searchQuery.toLowerCase());
      })
    : data;

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-5">
      {searchField && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-salon-primary" />
          <Input
            placeholder="Buscar..."
            className="pl-10 rounded-md border-salon-secondary/50 focus-visible:ring-salon-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      <div className="rounded-lg border border-salon-secondary/30 overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-salon-primary/5">
            <TableRow className="hover:bg-transparent">
              {columns.map((column, index) => (
                <TableHead key={index} className="font-playfair font-medium text-foreground">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center h-32"
                >
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Search className="h-10 w-10 mb-2 text-salon-secondary" />
                    <p>Nenhum resultado encontrado</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-salon-secondary/5 transition-colors">
                  {columns.map((column, columnIndex) => (
                    <TableCell key={columnIndex}>
                      {column.cell
                        ? column.cell({ row: { original: row } })
                        : typeof column.accessorKey === "function"
                        ? column.accessorKey(row)
                        : (() => {
                            // Handle nested properties using dot notation
                            if (typeof column.accessorKey === 'string' && column.accessorKey.includes('.')) {
                              const paths = column.accessorKey.split('.');
                              let value: any = row;
                              
                              for (const path of paths) {
                                if (!value) return '';
                                value = value[path as keyof typeof value];
                              }
                              
                              return String(value || '');
                            }
                            
                            return String(row[column.accessorKey as keyof T] || '');
                          })()
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className={currentPage === 1 
                  ? "pointer-events-none opacity-50" 
                  : "hover:bg-salon-primary hover:text-white transition-colors"}
              />
            </PaginationItem>
            <div className="flex items-center text-sm font-medium px-4 py-2 rounded-md bg-salon-primary/5">
              Página {currentPage} de {totalPages}
            </div>
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                className={
                  currentPage === totalPages 
                  ? "pointer-events-none opacity-50" 
                  : "hover:bg-salon-primary hover:text-white transition-colors"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
