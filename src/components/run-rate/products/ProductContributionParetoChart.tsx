"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatPct } from "@/lib/format";
import type { ProductMetric } from "@/lib/validators/run-rate";

type Props = Readonly<{ products: readonly ProductMetric[] }>;

export const ProductContributionParetoChart = ({ products }: Props) => {
  const topProducts = [...products]
    .sort((a, b) => b.contributionSales - a.contributionSales)
    .slice(0, 15);

  const chartData = topProducts.reduce<Array<{ name: string; contribution: number; cumulative: number }>>(
    (rows, product, index) => {
      const previousCumulative = index === 0 ? 0 : rows[index - 1]?.cumulative ?? 0;
      const currentCumulative = Number((previousCumulative + product.contributionSales).toFixed(2));

      return [
        ...rows,
        {
          name: product.productName,
          contribution: Number(product.contributionSales.toFixed(2)),
          cumulative: currentCumulative,
        },
      ];
    },
    [],
  );

  return (
    <BrutalCard title="Pareto Kontribusi Sales">
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 48, left: 8 }}>
          <CartesianGrid strokeDasharray="4 4" />
          <XAxis
            dataKey="name"
            interval={0}
            angle={-35}
            textAnchor="end"
            height={72}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={(value: number) => formatPct(value, 0)}
            width={44}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tickFormatter={(value: number) => formatPct(value, 0)}
            width={44}
          />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === "cumulative"
                ? [formatPct(value), "Kumulatif"]
                : [formatPct(value), "Kontribusi"]
            }
          />
          <Bar yAxisId="left" dataKey="contribution" fill="#60a5fa" stroke="#171717" strokeWidth={1} />
          <Line yAxisId="right" dataKey="cumulative" stroke="#171717" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </BrutalCard>
  );
};
