export type CsvValue = string | number | boolean | null | undefined;

/**
 * Builds a CSV string from row objects. The first row's keys define the
 * columns; values are escaped per RFC 4180.
 */
export function toCsv(rows: Record<string, CsvValue>[]): string {
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]);
  const escape = (v: CsvValue): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    columns.join(","),
    ...rows.map((row) => columns.map((c) => escape(row[c])).join(",")),
  ];
  return lines.join("\r\n");
}

/** Downloads the CSV via a temporary object URL. Browser-only. */
export function downloadCsv(filename: string, rows: Record<string, CsvValue>[]): void {
  const csv = toCsv(rows);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
