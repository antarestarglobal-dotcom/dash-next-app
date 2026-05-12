/**
 * Google Sheets API v4 helper.
 * Fetches all sheet data as 2D arrays — works even when the spreadsheet
 * has "Prevent viewers from downloading" enabled, because this reads
 * data through the API, not as a file download.
 *
 * Requires GOOGLE_SHEETS_API_KEY in .env (read-only key, no OAuth needed).
 * Enable: Google Cloud Console → APIs → Google Sheets API → Credentials → API Key
 */

const BASE = "https://sheets.googleapis.com/v4/spreadsheets";

export type SheetData = { name: string; rows: unknown[][] };

async function apiFetch(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Sheets API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function fetchAllSheets(
  sheetId: string,
  apiKey: string,
): Promise<SheetData[]> {
  // 1. Get spreadsheet metadata → list of sheet names
  const meta = (await apiFetch(
    `${BASE}/${sheetId}?key=${apiKey}&fields=sheets.properties(title,sheetId)`,
  )) as { sheets: Array<{ properties: { title: string } }> };

  const sheetNames = meta.sheets.map((s) => s.properties.title);

  // 2. Batch-fetch all sheets values in parallel
  const results = await Promise.all(
    sheetNames.map(async (name): Promise<SheetData> => {
      try {
        const data = (await apiFetch(
          `${BASE}/${sheetId}/values/${encodeURIComponent(name)}?key=${apiKey}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`,
        )) as { values?: unknown[][] };
        return { name, rows: data.values ?? [] };
      } catch {
        return { name, rows: [] };
      }
    }),
  );

  return results.filter((s) => s.rows.length > 0);
}
