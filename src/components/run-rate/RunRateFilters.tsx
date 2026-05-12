"use client";

import { BrutalSelect } from "@/components/ui/BrutalSelect";
import { useRunRateBrandsQuery } from "@/hooks/use-run-rate-brands-query";
import { useRunRateStoresQuery } from "@/hooks/use-run-rate-stores-query";
import type { RunRateFilter } from "@/lib/validators/run-rate";

type Props = Readonly<{
  filters: RunRateFilter;
  onChange: (filters: RunRateFilter) => void;
}>;

const currentPeriod = (): string => new Date().toISOString().slice(0, 7);

export const RunRateFilters = ({ filters, onChange }: Props) => {
  const storesQuery = useRunRateStoresQuery();
  const brandsQuery = useRunRateBrandsQuery();
  const storeOptions = [
    { value: "", label: "Semua Store" },
    ...(storesQuery.data ?? []).map((store) => ({ value: String(store.id), label: store.name })),
  ];
  const brandOptions = [
    { value: "", label: "Antarestar" },
    ...(brandsQuery.data ?? []).map((brand) => ({ value: String(brand.id), label: brand.name })),
  ];
  return (
    <div className="sticky top-0 z-10 bg-stone-50 border-2 border-neutral-950 shadow-[4px_4px_0px_#171717] p-3 flex flex-col sm:flex-row gap-3">
      <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-neutral-700">
        Periode
        <input
          type="month"
          value={filters.period ?? currentPeriod()}
          onChange={(event) => onChange({ ...filters, period: event.target.value })}
          className="bg-white border-2 border-neutral-950 px-3 py-2 text-sm text-neutral-950"
        />
      </label>
      <BrutalSelect
        label="Store / Platform"
        value={filters.storeId ? String(filters.storeId) : ""}
        options={storeOptions}
        onChange={(event) => onChange({ ...filters, storeId: event.target.value ? Number(event.target.value) : undefined })}
      />
      <BrutalSelect
        label="Brand"
        value={filters.brandId ? String(filters.brandId) : ""}
        options={brandOptions}
        onChange={(event) => onChange({ ...filters, brandId: event.target.value ? Number(event.target.value) : undefined })}
      />
    </div>
  );
};
