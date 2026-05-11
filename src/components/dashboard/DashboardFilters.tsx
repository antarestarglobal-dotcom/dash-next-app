"use client";

import { BrutalSelect } from "@/components/ui/BrutalSelect";
import { BrutalInput } from "@/components/ui/BrutalInput";
import type { DashboardFilter } from "@/lib/validators/dashboard";

interface DashboardFiltersProps {
  filters: DashboardFilter;
  onChange: (filters: DashboardFilter) => void;
}

const METRIC_OPTIONS = [
  { value: "net_sales", label: "Net Sales" },
  { value: "gmv", label: "GMV" },
];

export function DashboardFilters({ filters, onChange }: DashboardFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <BrutalInput
        label="Start Date"
        type="date"
        value={filters.startDate ?? ""}
        onChange={(e) => onChange({ ...filters, startDate: e.target.value || undefined })}
        className="w-36"
      />
      <BrutalInput
        label="End Date"
        type="date"
        value={filters.endDate ?? ""}
        onChange={(e) => onChange({ ...filters, endDate: e.target.value || undefined })}
        className="w-36"
      />
      <BrutalSelect
        label="Metric"
        options={METRIC_OPTIONS}
        placeholder="Semua Metric"
        value={filters.metric ?? ""}
        onChange={(e) => onChange({ ...filters, metric: e.target.value || undefined })}
        className="w-36"
      />
    </div>
  );
}
