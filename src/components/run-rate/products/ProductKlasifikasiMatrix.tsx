"use client";

import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import type { ProductMetric } from "@/lib/validators/run-rate";

type Props = Readonly<{ products: readonly ProductMetric[] }>;

export const ProductKlasifikasiMatrix = ({ products }: Props) => (
  <BrutalCard title="Klasifikasi Matrix">
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart data={products.map((product) => ({ ...product, contribution: product.contributionProfit }))}>
        <CartesianGrid strokeDasharray="4 4" />
        <XAxis dataKey="npm" name="NPM" unit="%" />
        <YAxis dataKey="contribution" name="Contribution" unit="%" />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Scatter dataKey="contribution" fill="#22c55e" stroke="#171717" />
      </ScatterChart>
    </ResponsiveContainer>
  </BrutalCard>
);
