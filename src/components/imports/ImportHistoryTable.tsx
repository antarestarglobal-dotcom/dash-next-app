"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { BrutalDataTable } from "@/components/ui/BrutalDataTable";
import { BrutalBadge } from "@/components/ui/BrutalBadge";
import type { ImportStatus } from "@/lib/validators/import";

interface ImportRow {
  id: string;
  sourceName: string;
  sheetName: string | null;
  templateType: string;
  status: string;
  createdAt: string | null;
  importedAt: string | null;
  errorMessage: string | null;
}

interface ImportHistoryTableProps {
  data: ImportRow[];
}

const columnHelper = createColumnHelper<ImportRow>();

const columns = [
  columnHelper.accessor("sourceName", { header: "File", cell: (i) => <span className="font-medium">{i.getValue()}</span> }),
  columnHelper.accessor("sheetName", { header: "Sheet", cell: (i) => i.getValue() ?? "-" }),
  columnHelper.accessor("templateType", { header: "Template" }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (i) => {
      const status = i.getValue() as ImportStatus;
      return <BrutalBadge variant={status}>{status}</BrutalBadge>;
    },
  }),
  columnHelper.accessor("createdAt", {
    header: "Dibuat",
    cell: (i) => {
      const v = i.getValue();
      return v ? new Date(v).toLocaleString("id-ID") : "-";
    },
  }),
  columnHelper.accessor("importedAt", {
    header: "Diimport",
    cell: (i) => {
      const v = i.getValue();
      return v ? new Date(v).toLocaleString("id-ID") : "-";
    },
  }),
  columnHelper.accessor("errorMessage", {
    header: "Error",
    cell: (i) => {
      const v = i.getValue();
      return v ? <span className="text-red-700 text-xs">{v}</span> : "-";
    },
  }),
];

export function ImportHistoryTable({ data }: ImportHistoryTableProps) {
  return <BrutalDataTable data={data} columns={columns} pageSize={20} globalFilter />;
}
