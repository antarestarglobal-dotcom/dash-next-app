import type { Klasifikasi } from "@/lib/validators/run-rate";

const EMPTY_MEDIAN = 0 as const;

const median = (numbers: readonly number[]): number => {
  if (numbers.length === 0) return EMPTY_MEDIAN;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const lower = sorted[Math.max(mid - 1, 0)] ?? EMPTY_MEDIAN;
  const current = sorted[mid] ?? EMPTY_MEDIAN;
  return sorted.length % 2 === 0 ? (lower + current) / 2 : current;
};

const buildClassifier = (medianNpm: number, medianProfit: number) =>
  (product: Readonly<{ npm: number; netProfit: number }>): Klasifikasi => {
    const highNpm = product.npm >= medianNpm;
    const highProfit = product.netProfit >= medianProfit;
    return highNpm && highProfit
      ? "bintang"
      : highNpm
        ? "potensial"
        : highProfit
          ? "perlu_efisiensi"
          : "bermasalah";
  };

export const classifyAll = <T extends Readonly<{ npm: number; netProfit: number }>>(
  products: readonly T[],
): readonly (T & { klasifikasi: Klasifikasi })[] => {
  const classify = buildClassifier(
    median(products.map((product) => product.npm)),
    median(products.map((product) => product.netProfit)),
  );
  return products.map((product) => ({ ...product, klasifikasi: classify(product) }));
};
