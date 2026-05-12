"use client";

import { BrutalCard } from "@/components/ui/BrutalCard";
import { BrutalDataTable, type BrutalColumn } from "@/components/ui/BrutalDataTable";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface DailyMetricRow {
  id: number;
  date: string;
  dayName: string | null;
  total: number | null;
  contributionPercent: number | null;
  metric: string;
}

const columns: BrutalColumn<DailyMetricRow>[] = [
  {
    id: "date",
    header: "Tanggal",
    cell: (row) => row.date,
    sortValue: (row) => row.date,
  },
  {
    id: "dayName",
    header: "Hari",
    cell: (row) => row.dayName ?? "-",
    sortValue: (row) => row.dayName ?? "",
  },
  {
    id: "metric",
    header: "Metric",
    cell: (row) => row.metric,
    sortValue: (row) => row.metric,
  },
  {
    id: "total",
    header: "Total",
    cell: (row) => (row.total !== null ? formatCurrency(row.total) : "-"),
    sortValue: (row) => row.total ?? null,
  },
  {
    id: "contributionPercent",
    header: "Kontribusi",
    cell: (row) => (row.contributionPercent !== null ? formatPercent(row.contributionPercent) : "-"),
    sortValue: (row) => row.contributionPercent ?? null,
  },
];

interface DailyMetricsTableProps {
  data: DailyMetricRow[];
}

export function DailyMetricsTable({ data }: DailyMetricsTableProps) {
  return (
    <BrutalCard title="Daily Metrics" variant="flat">
      <BrutalDataTable data={data} columns={columns} pageSize={20} globalFilter />
    </BrutalCard>
  );
}
