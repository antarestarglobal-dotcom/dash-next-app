import { TrendingUp, Calendar, Clock, BarChart2 } from "lucide-react";
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

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
}

function MetricCard({ label, value, sub, icon: Icon }: MetricCardProps) {
  return (
    <div className="bg-white border-2 border-neutral-950 shadow-[4px_4px_0px_#171717] p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold text-neutral-600 uppercase tracking-wide">{label}</p>
        <Icon className="w-4 h-4 text-neutral-400" />
      </div>
      <p className="text-2xl font-bold text-neutral-950 leading-tight">{value}</p>
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
    </div>
  );
}

export function MetricCards({ summary, bestHour }: MetricCardsProps) {
  const bestHourLabel =
    bestHour.hour !== null ? `${String(bestHour.hour).padStart(2, "0")}:00` : "-";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        label="Total MTD / Net Sales"
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
