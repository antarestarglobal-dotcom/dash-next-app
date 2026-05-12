"use client";

import { useMemo } from "react";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { BrutalDataTable, type BrutalColumn } from "@/components/ui/BrutalDataTable";
import { formatCurrency } from "@/lib/utils";

export interface HostRow {
  hostId: number | null;
  hostName: string;
  totalGmv: number | null;
}

type RankedHostRow = HostRow & { rank: number };

const columns: BrutalColumn<RankedHostRow>[] = [
  {
    id: "rank",
    header: "#",
    cell: (row) => <span className="font-bold text-neutral-500 w-6 inline-block">{row.rank}</span>,
    sortValue: (row) => row.rank,
  },
  {
    id: "hostName",
    header: "Host",
    cell: (row) => <span className="font-semibold">{row.hostName}</span>,
    sortValue: (row) => row.hostName,
  },
  {
    id: "totalGmv",
    header: "Total GMV",
    cell: (row) => formatCurrency(row.totalGmv),
    sortValue: (row) => row.totalGmv ?? null,
  },
];

interface HostLeaderboardProps {
  data: HostRow[];
  pageSize?: number;
}

export function HostLeaderboard({ data, pageSize = 10 }: HostLeaderboardProps) {
  const rankedData = useMemo(
    () => data.map((row, i) => ({ ...row, rank: i + 1 })),
    [data],
  );

  return (
    <BrutalCard title="Host Leaderboard" className="h-full">
      <BrutalDataTable data={rankedData} columns={columns} pageSize={pageSize} />
    </BrutalCard>
  );
}
