"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { cn } from "@/lib/utils";

interface ImportUploaderProps {
  onFile: (file: File) => void;
  isPending: boolean;
}

export function ImportUploader({ onFile, isPending }: ImportUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert("Hanya file XLSX, XLS, atau CSV yang didukung.");
      return;
    }
    onFile(file);
  }

  return (
    <div
      className={cn(
        "border-2 border-neutral-950 bg-white shadow-[4px_4px_0px_#171717] transition-colors",
        dragOver && "bg-stone-100",
        isPending && "opacity-60 pointer-events-none",
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <div className="border-b-2 border-neutral-950 px-5 py-3 bg-stone-100">
        <p className="text-xs font-bold text-neutral-950 uppercase tracking-widest">Upload File</p>
      </div>

      <div className="px-8 py-10 flex flex-col items-center gap-4">
        <Upload className="w-8 h-8 text-neutral-400" />
        <div className="text-center">
          <p className="text-sm font-semibold text-neutral-950">
            Drag & drop file XLSX / XLS / CSV
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            File akan di-preview sebelum diimport ke database
          </p>
        </div>

        <BrutalButton
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
        >
          {isPending ? "Memproses..." : "Pilih File"}
        </BrutalButton>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
