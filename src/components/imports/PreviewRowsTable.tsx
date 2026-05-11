"use client";

import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { BrutalDataTable } from "@/components/ui/BrutalDataTable";

interface PreviewRowsTableProps {
  rows: Record<string, unknown>[];
}

export function PreviewRowsTable({ rows }: PreviewRowsTableProps) {
  const columnHelper = createColumnHelper<Record<string, unknown>>();

  const columns = useMemo(() => {
    if (rows.length === 0) return [];
    const keys = Object.keys(rows[0]!).filter((k) => k !== "hours");
    return keys.map((key) =>
      columnHelper.accessor(key, {
        header: key,
        cell: (info) => {
          const val = info.getValue();
          if (val === null || val === undefined) return <span className="text-neutral-400">-</span>;
          return String(val);
        },
      }),
    );
  }, [rows, columnHelper]);

  if (rows.length === 0) return <p className="text-sm text-neutral-500">Tidak ada preview rows.</p>;

  return <BrutalDataTable data={rows} columns={columns} pageSize={10} />;
}
