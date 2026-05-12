import Link from "next/link";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { LayoutDashboard, Upload, History } from "lucide-react";

const CARDS = [
  {
    href: "/global",
    icon: LayoutDashboard,
    title: "Global Command Center",
    description:
      "Semua visual utama dalam satu halaman: Overview, Products, DoD, Funnel, Marketing, Stock, dan MoM.",
    cta: "Buka Global",
    variant: "secondary" as const,
    highlight: true,
  },
  {
    href: "/imports",
    icon: Upload,
    title: "Import Data",
    description: "Sync dari Google Sheets atau upload XLSX/CSV. Preview hasil parsing sebelum konfirmasi ke database.",
    cta: "Import Data",
    variant: "secondary" as const,
    highlight: false,
  },
  {
    href: "/imports/history",
    icon: History,
    title: "Riwayat Import",
    description: "Lihat semua riwayat import beserta status, warnings, dan error detail.",
    cta: "Lihat History",
    variant: "secondary" as const,
    highlight: false,
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-col gap-10 py-8">
      {/* Hero */}
      <div>
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">
          Internal Dashboard · Antarestar
        </p>
        <h1 className="text-4xl font-black text-neutral-950 tracking-tight leading-none">
          CEO Command Center
        </h1>
        <p className="text-neutral-500 mt-3 text-sm max-w-xl">
          Platform pusat data bisnis Antarestar. Sync langsung dari Google Sheets, lalu analisa
          performa sales, marketing, stok, dan target dalam satu dashboard terintegrasi.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CARDS.map(({ href, icon: Icon, title, description, cta, variant, highlight }) => (
          <BrutalCard
            key={href}
            className={highlight ? "bg-neutral-950" : undefined}
          >
            <div className="flex flex-col gap-4 h-full">
              <Icon className={`w-7 h-7 ${highlight ? "text-white" : "text-neutral-950"}`} />
              <div className="flex-1">
                <h2 className={`font-black text-lg mb-1 ${highlight ? "text-white" : "text-neutral-950"}`}>
                  {title}
                </h2>
                <p className={`text-sm ${highlight ? "text-neutral-300" : "text-neutral-500"}`}>
                  {description}
                </p>
              </div>
              <Link href={href}>
                <BrutalButton
                  variant={highlight ? "secondary" : variant}
                  className={`w-full ${highlight ? "bg-white text-neutral-950 hover:bg-stone-100" : ""}`}
                >
                  {cta}
                </BrutalButton>
              </Link>
            </div>
          </BrutalCard>
        ))}
      </div>
    </div>
  );
}
