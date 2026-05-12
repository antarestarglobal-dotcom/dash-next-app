import { TrendingUp, Calendar, BarChart2, Clock } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface DashboardSummary {
  totalMtd: number;
  dailyAvg: number;
  bestDayTotal: number;
  rowCount: number;
}

interface BestHour {
  hour: number | null;
  avgPercent: number;
}

interface MetricCardsProps {
  summary: DashboardSummary;
  bestHour: BestHour;
}

function HeroCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: React.ElementType }) {
  return (
    <div className="bg-neutral-950 border-2 border-neutral-950 shadow-[4px_4px_0px_#525252] p-5 flex flex-col justify-between min-h-[108px]">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
        <Icon className="w-4 h-4 text-neutral-500" />
      </div>
      <div>
        <p className="text-2xl font-black text-white leading-tight">{value}</p>
        {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: React.ElementType }) {
  return (
    <div className="bg-white border-2 border-neutral-950 shadow-[4px_4px_0px_#171717] p-5 flex flex-col justify-between min-h-[108px]">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{label}</p>
        <Icon className="w-4 h-4 text-neutral-300" />
      </div>
      <div>
        <p className="text-2xl font-black text-neutral-950 leading-tight">{value}</p>
        {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export function MetricCards({ summary, bestHour }: MetricCardsProps) {
  const bestHourLabel =
    bestHour.hour !== null ? `${String(bestHour.hour).padStart(2, "0")}:00` : "—";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <HeroCard
        label="Total Net Sales"
        value={formatCurrency(summary.totalMtd)}
        sub={`${formatNumber(summary.rowCount)} hari data`}
        icon={TrendingUp}
      />
      <MetricCard
        label="Daily Average"
        value={formatCurrency(summary.dailyAvg)}
        icon={Calendar}
      />
      <MetricCard
        label="Best Day"
        value={formatCurrency(summary.bestDayTotal)}
        icon={BarChart2}
      />
      <MetricCard
        label="Best Hour"
        value={bestHourLabel}
        sub={bestHour.hour !== null ? `Avg ${bestHour.avgPercent.toFixed(2)}%` : "Belum ada data"}
        icon={Clock}
      />
    </div>
  );
}
