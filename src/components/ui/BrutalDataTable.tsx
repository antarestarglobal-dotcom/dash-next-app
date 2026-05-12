"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { BrutalButton } from "./BrutalButton";
import { cn } from "@/lib/utils";

export interface BrutalColumn<TData> {
  id: string;
  header: ReactNode;
  cell: (row: TData) => ReactNode;
  sortValue?: (row: TData) => string | number | null | undefined;
}

interface BrutalDataTableProps<TData> {
  data: TData[];
  columns: BrutalColumn<TData>[];
  pageSize?: number;
  globalFilter?: boolean;
  className?: string;
}

interface SortState {
  columnId: string;
  direction: "asc" | "desc";
}

export function BrutalDataTable<TData>({
  data,
  columns,
  pageSize = 20,
  globalFilter = false,
  className,
}: BrutalDataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortState | null>(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  const filteredRows = useMemo(() => {
    if (!globalFilter) return data;
    const q = globalFilterValue.trim().toLowerCase();
    if (!q) return data;

    return data.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [data, globalFilter, globalFilterValue]);

  const sortedRows = useMemo(() => {
    if (!sorting) return filteredRows;

    const column = columns.find((col) => col.id === sorting.columnId);
    if (!column || !column.sortValue) return filteredRows;

    const rows = [...filteredRows];
    rows.sort((a, b) => {
      const aValue = column.sortValue?.(a);
      const bValue = column.sortValue?.(b);

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sorting.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      const cmp = String(aValue).localeCompare(String(bValue), "id", { numeric: true });
      return sorting.direction === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [columns, filteredRows, sorting]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const effectivePageIndex = Math.min(pageIndex, totalPages - 1);

  const paginatedRows = useMemo(() => {
    const start = effectivePageIndex * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [effectivePageIndex, pageSize, sortedRows]);

  function toggleSort(columnId: string) {
    setPageIndex(0);
    setSorting((prev) => {
      if (!prev || prev.columnId !== columnId) {
        return { columnId, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { columnId, direction: "desc" };
      }
      return null;
    });
  }

  function getRowKey(row: TData, index: number): string {
    if (row && typeof row === "object" && "id" in (row as Record<string, unknown>)) {
      const id = (row as Record<string, unknown>).id;
      if (typeof id === "string" || typeof id === "number") return String(id);
    }
    return String(index);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {globalFilter && (
        <input
          value={globalFilterValue}
          onChange={(e) => {
            setGlobalFilterValue(e.target.value);
            setPageIndex(0);
          }}
          placeholder="Cari..."
          className="bg-white border-2 border-neutral-950 rounded-none px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-neutral-950"
        />
      )}

      <div className="overflow-x-auto border-2 border-neutral-950">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-neutral-100 border-b-2 border-neutral-950">
              {columns.map((column) => {
                const isSortable = Boolean(column.sortValue);
                const isSorted = sorting?.columnId === column.id ? sorting.direction : null;

                return (
                  <th
                    key={column.id}
                    className="px-3 py-2 text-left font-bold text-neutral-950 text-xs uppercase tracking-wide whitespace-nowrap border-r border-neutral-300 last:border-r-0"
                    onClick={() => isSortable && toggleSort(column.id)}
                    style={{ cursor: isSortable ? "pointer" : "default" }}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {isSortable && (
                        <span className="text-neutral-400">
                          {isSorted === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : isSorted === "desc" ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronsUpDown className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-neutral-500 text-sm"
                >
                  Tidak ada data
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIndex) => (
                <tr
                  key={getRowKey(row, pageIndex * pageSize + rowIndex)}
                  className="border-b border-neutral-200 hover:bg-neutral-50 last:border-b-0"
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className="px-3 py-2 text-neutral-950 border-r border-neutral-100 last:border-r-0"
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-600">
            Halaman {effectivePageIndex + 1} dari {totalPages} &middot; {filteredRows.length} baris
          </span>
          <div className="flex gap-2">
            <BrutalButton
              size="sm"
              variant="secondary"
              onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
              disabled={effectivePageIndex === 0}
            >
              &larr; Prev
            </BrutalButton>
            <BrutalButton
              size="sm"
              variant="secondary"
              onClick={() => setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={effectivePageIndex >= totalPages - 1}
            >
              Next &rarr;
            </BrutalButton>
          </div>
        </div>
      )}
    </div>
  );
}
