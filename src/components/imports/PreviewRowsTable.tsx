"use client";

import { useMemo } from "react";
import { BrutalDataTable, type BrutalColumn } from "@/components/ui/BrutalDataTable";

interface PreviewRowsTableProps {
  rows: Record<string, unknown>[];
}

export function PreviewRowsTable({ rows }: PreviewRowsTableProps) {
  const columns = useMemo(() => {
    if (rows.length === 0) return [];
    const firstRow = rows[0];
    if (!firstRow) return [];

    const keys = Object.keys(firstRow).filter((k) => k !== "hours");
    return keys.map<BrutalColumn<Record<string, unknown>>>((key) => ({
      id: key,
      header: key,
      cell: (row) => {
        const val = row[key];
        if (val === null || val === undefined) return <span className="text-neutral-400">-</span>;
        return String(val);
      },
      sortValue: (row) => {
        const val = row[key];
        if (typeof val === "number") return val;
        if (typeof val === "string") return val;
        return val == null ? null : String(val);
      },
    }));
  }, [rows]);

  if (rows.length === 0) return <p className="text-sm text-neutral-500">Tidak ada preview rows.</p>;

  return <BrutalDataTable data={rows} columns={columns} pageSize={10} />;
}
