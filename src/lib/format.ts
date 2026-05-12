export const formatRp = (n: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export const formatRpCompact = (n: number): string =>
  n >= 1_000_000_000
    ? `${(n / 1_000_000_000).toFixed(1)}M`
    : n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(0)}Jt`
      : n >= 1_000
        ? `${(n / 1_000).toFixed(0)}Rb`
        : String(n);

export const formatPct = (n: number, decimals = 2): string => `${n.toFixed(decimals)}%`;

export const formatShortDate = (dateStr: string): string => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};
