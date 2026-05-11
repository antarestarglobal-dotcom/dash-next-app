"use client";

import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { BrutalDataTable } from "@/components/ui/BrutalDataTable";
import { formatCurrency } from "@/lib/utils";

interface HostRow {
  hostId: number | null;
  hostName: string;
  totalGmv: string;
}

const columnHelper = createColumnHelper<HostRow & { rank: number }>();

const columns = [
  columnHelper.accessor("rank", {
    header: "#",
    cell: (i) => (
      <span className="font-bold text-neutral-500 w-6 inline-block">{i.getValue()}</span>
    ),
  }),
  columnHelper.accessor("hostName", {
    header: "Host",
    cell: (i) => <span className="font-semibold">{i.getValue()}</span>,
  }),
  columnHelper.accessor("totalGmv", {
    header: "Total GMV",
    cell: (i) => formatCurrency(parseFloat(i.getValue())),
  }),
];

interface HostLeaderboardProps {
  data: HostRow[];
}

export function HostLeaderboard({ data }: HostLeaderboardProps) {
  const rankedData = useMemo(
    () => data.map((row, i) => ({ ...row, rank: i + 1 })),
    [data],
  );

  return (
    <BrutalCard title="Host Leaderboard">
      <BrutalDataTable data={rankedData} columns={columns} pageSize={10} />
    </BrutalCard>
  );
}
