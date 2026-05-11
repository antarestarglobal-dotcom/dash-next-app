"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { BrutalButton } from "./BrutalButton";
import { cn } from "@/lib/utils";

interface BrutalDataTableProps<TData> {
  data: TData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  pageSize?: number;
  globalFilter?: boolean;
  className?: string;
}

export function BrutalDataTable<TData>({
  data,
  columns,
  pageSize = 20,
  globalFilter = false,
  className,
}: BrutalDataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: globalFilterValue },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilterValue,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {globalFilter && (
        <input
          value={globalFilterValue}
          onChange={(e) => setGlobalFilterValue(e.target.value)}
          placeholder="Cari..."
          className="bg-white border-2 border-neutral-950 rounded-none px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-neutral-950"
        />
      )}

      <div className="overflow-x-auto border-2 border-neutral-950">
        <table className="w-full text-sm border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-neutral-100 border-b-2 border-neutral-950">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left font-bold text-neutral-950 text-xs uppercase tracking-wide whitespace-nowrap border-r border-neutral-300 last:border-r-0"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: header.column.getCanSort() ? "pointer" : "default" }}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-neutral-400">
                          {header.column.getIsSorted() === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronsUpDown className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-neutral-500 text-sm"
                >
                  Tidak ada data
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-neutral-200 hover:bg-neutral-50 last:border-b-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-2 text-neutral-950 border-r border-neutral-100 last:border-r-0"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-600">
            Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()} &middot;{" "}
            {table.getFilteredRowModel().rows.length} baris
          </span>
          <div className="flex gap-2">
            <BrutalButton
              size="sm"
              variant="secondary"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              &larr; Prev
            </BrutalButton>
            <BrutalButton
              size="sm"
              variant="secondary"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next &rarr;
            </BrutalButton>
          </div>
        </div>
      )}
    </div>
  );
}
