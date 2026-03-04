/**
 * CSV Export utility for resources data
 */

import { Resource } from "@/types/index";

interface ExportRow {
  title: string;
  author_email: string;
  time_saved: number | null;
  tools: string;
  views: number;
  saved: number;
  tried: number;
}

/**
 * Convert resources to CSV format
 */
function resourcesToCSV(resources: Resource[]): string {
  // Define headers
  const headers = [
    "Title",
    "Author Email",
    "Time Saved (hours)",
    "Tools",
    "Views",
    "Saved",
    "Tried",
  ];

  // Convert resources to rows
  const rows: ExportRow[] = resources.map((resource) => ({
    title: resource.title,
    author_email: resource.author_email || "Anonymous",
    time_saved: resource.time_saved_value ?? null,
    tools: resource.tools_used ? Object.keys(resource.tools_used).join("; ") : "",
    views: resource.analytics?.view_count ?? 0,
    saved: resource.analytics?.save_count ?? 0,
    tried: resource.analytics?.tried_count ?? 0,
  }));

  // Escape CSV values
  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "";
    }
    const stringValue = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV content
  const csvContent = [
    headers.map(escapeCSVValue).join(","),
    ...rows.map((row) =>
      [
        escapeCSVValue(row.title),
        escapeCSVValue(row.author_email),
        escapeCSVValue(row.time_saved),
        escapeCSVValue(row.tools),
        escapeCSVValue(row.views),
        escapeCSVValue(row.saved),
        escapeCSVValue(row.tried),
      ].join(",")
    ),
  ].join("\n");

  return csvContent;
}

/**
 * Trigger CSV download in browser
 */
export function downloadCSV(resources: Resource[], filename: string = "resources.csv"): void {
  const csv = resourcesToCSV(resources);

  // Create blob
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get formatted filename with timestamp
 */
export function getExportFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString().split("T")[0]; // YYYY-MM-DD
  return `ai-exchange-resources-${timestamp}.csv`;
}
