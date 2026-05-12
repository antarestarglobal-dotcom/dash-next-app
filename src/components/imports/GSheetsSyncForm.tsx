"use client";

import { useState } from "react";
import { Link2, Info } from "lucide-react";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { BrutalInput } from "@/components/ui/BrutalInput";

interface GSheetsSyncFormProps {
  onSync: (url: string) => void;
  isPending: boolean;
}

const SHEET_TAGS = [
  "Sales",
  "Voucher",
  "Iklan",
  "Affiliate",
  "Sample",
  "Endorse",
  "Other Cost",
  "DATA-ACCEL (Stok)",
] as const;

export function GSheetsSyncForm({ onSync, isPending }: GSheetsSyncFormProps) {
  const [url, setUrl] = useState(
    "https://docs.google.com/spreadsheets/d/1xDzJHyCR5nVMIuPw-_RrwjzoZcBtoVANcY9esgEzOPY",
  );

  return (
    <div className="border-2 border-neutral-950 bg-white shadow-[4px_4px_0px_#171717]">
      <div className="border-b-2 border-neutral-950 px-5 py-3 bg-stone-100 flex items-center gap-2">
        <Link2 className="w-4 h-4 flex-shrink-0" />
        <p className="text-xs font-bold text-neutral-950 uppercase tracking-widest">
          Sync dari Google Sheets
        </p>
      </div>

      <div className="px-6 py-6 flex flex-col gap-5">
        <div className="flex items-start gap-2 text-sm text-neutral-600 bg-stone-50 border border-neutral-200 p-3">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-neutral-400" />
          <p>
            Paste URL Google Sheets yang sudah diset{" "}
            <strong className="text-neutral-950">Anyone with the link = Viewer</strong>.
            Semua sheet yang dikenali akan di-parse dan di-preview otomatis sebelum diimport.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap sm:flex-nowrap items-end">
          <div className="flex-1 min-w-0">
            <BrutalInput
              label="URL Google Sheets"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="font-mono text-xs w-full"
              disabled={isPending}
            />
          </div>
          <BrutalButton
            onClick={() => onSync(url.trim())}
            disabled={isPending || !url.trim()}
            className="flex-shrink-0"
          >
            {isPending ? "Mengunduh..." : "Sync Sekarang"}
          </BrutalButton>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
            Sheet yang akan di-import
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SHEET_TAGS.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-bold border border-neutral-300 px-2 py-0.5 text-neutral-500 bg-stone-50"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
