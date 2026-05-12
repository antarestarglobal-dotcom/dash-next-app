"use client";

import { BrutalDataTable, type BrutalColumn } from "@/components/ui/BrutalDataTable";
import { BrutalBadge } from "@/components/ui/BrutalBadge";
import type { ImportListItem } from "@/lib/validators/import";

interface ImportHistoryTableProps {
  data: ImportListItem[];
}

const columns: BrutalColumn<ImportListItem>[] = [
  {
    id: "sourceName",
    header: "File",
    cell: (row) => <span className="font-medium">{row.sourceName}</span>,
    sortValue: (row) => row.sourceName,
  },
  {
    id: "sheetName",
    header: "Sheet",
    cell: (row) => row.sheetName ?? "-",
    sortValue: (row) => row.sheetName ?? "",
  },
  {
    id: "templateType",
    header: "Template",
    cell: (row) => row.templateType,
    sortValue: (row) => row.templateType,
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <BrutalBadge variant={row.status}>{row.status}</BrutalBadge>,
    sortValue: (row) => row.status,
  },
  {
    id: "createdAt",
    header: "Dibuat",
    cell: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString("id-ID") : "-"),
    sortValue: (row) => row.createdAt ?? "",
  },
  {
    id: "importedAt",
    header: "Diimport",
    cell: (row) => (row.importedAt ? new Date(row.importedAt).toLocaleString("id-ID") : "-"),
    sortValue: (row) => row.importedAt ?? "",
  },
  {
    id: "errorMessage",
    header: "Error",
    cell: (row) => (row.errorMessage ? <span className="text-red-700 text-xs">{row.errorMessage}</span> : "-"),
    sortValue: (row) => row.errorMessage ?? "",
  },
];

export function ImportHistoryTable({ data }: ImportHistoryTableProps) {
  return <BrutalDataTable data={data} columns={columns} pageSize={20} globalFilter />;
}
