"use client";

import { BrutalCard } from "@/components/ui/BrutalCard";
import type { StockStatus } from "@/lib/validators/run-rate";

type Props = Readonly<{ stocks: readonly StockStatus[] }>;

const countByDays = (stocks: readonly StockStatus[], predicate: (days: number) => boolean): number =>
  stocks.filter((stock) => stock.limit0Days !== null && predicate(stock.limit0Days)).length;

export const StockAlertCards = ({ stocks }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <BrutalCard className="bg-red-200"><p className="text-xs font-black uppercase">Kritis</p><p className="text-3xl font-black">{countByDays(stocks, (days) => days < 7)}</p></BrutalCard>
    <BrutalCard className="bg-yellow-200"><p className="text-xs font-black uppercase">Perlu Restock</p><p className="text-3xl font-black">{countByDays(stocks, (days) => days >= 7 && days <= 30)}</p></BrutalCard>
    <BrutalCard className="bg-green-200"><p className="text-xs font-black uppercase">Aman</p><p className="text-3xl font-black">{countByDays(stocks, (days) => days > 30)}</p></BrutalCard>
  </div>
);
