import type { ReportResult } from "./reports";

const stamp = () => new Date().toISOString().slice(0, 10);
const fileBase = (r: ReportResult) => `${r.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${stamp()}`;

/** Excel (.xlsx) download. Libraries are loaded on demand so they stay out of the main bundle. */
export async function downloadExcel(r: ReportResult, meta: string) {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([[r.title], [meta], [], r.columns, ...r.rows]);
  sheet["!cols"] = r.columns.map((c, i) => ({ wch: Math.min(48, Math.max(c.length, ...r.rows.map((row) => row[i]?.length ?? 0)) + 2) }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Report");
  XLSX.writeFile(book, `${fileBase(r)}.xlsx`);
}

/** PDF download (landscape A4 table). */
export async function downloadPdf(r: ReportResult, meta: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(16);
  doc.text(`abcd — ${r.title}`, 40, 42);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(meta, 40, 58);
  autoTable(doc, {
    startY: 72,
    head: [r.columns],
    body: r.rows,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [15, 28, 56] },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.text(`Page ${doc.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 70, doc.internal.pageSize.getHeight() - 20);
    },
  });
  doc.save(`${fileBase(r)}.pdf`);
}
