import Link from "next/link";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { BarChart2, Upload, History } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-10 py-8">
      <div>
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">
          Internal Dashboard
        </p>
        <h1 className="text-4xl font-black text-neutral-950 tracking-tight">
          CEO Command Center
        </h1>
        <p className="text-neutral-600 mt-2 text-sm max-w-lg">
          Platform pusat data bisnis Antarestar. Import data dari Excel, preview, lalu konfirmasi ke
          PostgreSQL.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <BrutalCard>
          <BarChart2 className="w-7 h-7 mb-4 text-neutral-950" />
          <h2 className="font-bold text-lg mb-1">Dashboard</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Lihat GMV, daily trend, hourly heatmap, dan host leaderboard.
          </p>
          <Link href="/dashboard">
            <BrutalButton className="w-full">Buka Dashboard</BrutalButton>
          </Link>
        </BrutalCard>

        <BrutalCard>
          <Upload className="w-7 h-7 mb-4 text-neutral-950" />
          <h2 className="font-bold text-lg mb-1">Import Data</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Upload file XLSX/CSV, preview hasil parsing, dan confirm import ke database.
          </p>
          <Link href="/imports">
            <BrutalButton className="w-full">Import Data</BrutalButton>
          </Link>
        </BrutalCard>

        <BrutalCard>
          <History className="w-7 h-7 mb-4 text-neutral-950" />
          <h2 className="font-bold text-lg mb-1">Import History</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Lihat riwayat semua import beserta status, warnings, dan error.
          </p>
          <Link href="/imports/history">
            <BrutalButton variant="secondary" className="w-full">
              Lihat History
            </BrutalButton>
          </Link>
        </BrutalCard>
      </div>
    </div>
  );
}
