import { BrutalAlert } from "@/components/ui/BrutalAlert";

interface ImportWarningsProps {
  warnings: string[];
  rejectedCount: number;
}

export function ImportWarnings({ warnings, rejectedCount }: ImportWarningsProps) {
  if (warnings.length === 0 && rejectedCount === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {warnings.length > 0 && (
        <BrutalAlert variant="warning" title={`${warnings.length} Peringatan`}>
          <ul className="list-disc list-inside space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs">{w}</li>
            ))}
          </ul>
        </BrutalAlert>
      )}
      {rejectedCount > 0 && (
        <BrutalAlert variant="error" title={`${rejectedCount} Baris Ditolak`}>
          Baris-baris ini tidak dapat diparsing dan tidak akan diimport.
        </BrutalAlert>
      )}
    </div>
  );
}
