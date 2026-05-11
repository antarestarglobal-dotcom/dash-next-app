"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { BrutalDataTable } from "@/components/ui/BrutalDataTable";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface DailyMetricRow {
  id: number;
  date: string;
  dayName: string | null;
  total: string | null;
  contributionPercent: string | null;
  metric: string;
}

const columnHelper = createColumnHelper<DailyMetricRow>();

const columns = [
  columnHelper.accessor("date", { header: "Tanggal" }),
  columnHelper.accessor("dayName", { header: "Hari", cell: (i) => i.getValue() ?? "-" }),
  columnHelper.accessor("metric", { header: "Metric" }),
  columnHelper.accessor("total", {
    header: "Total",
    cell: (i) => {
      const v = i.getValue();
      return v ? formatCurrency(parseFloat(v)) : "-";
    },
  }),
  columnHelper.accessor("contributionPercent", {
    header: "Kontribusi",
    cell: (i) => {
      const v = i.getValue();
      return v ? formatPercent(parseFloat(v)) : "-";
    },
  }),
];

interface DailyMetricsTableProps {
  data: DailyMetricRow[];
}

export function DailyMetricsTable({ data }: DailyMetricsTableProps) {
  return (
    <BrutalCard title="Daily Metrics">
      <BrutalDataTable data={data} columns={columns} pageSize={20} globalFilter />
    </BrutalCard>
  );
}
