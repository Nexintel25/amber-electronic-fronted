export type Section = { name: string; columns: string[]; rows: string[][] };
export type ReportResult = { title: string; sections: Section[]; summary: { label: string; value: string }[] };

const stamp = () => new Date().toISOString().slice(0, 10);
const fileBase = (r: ReportResult) => `${r.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${stamp()}`;

/** Excel (.xlsx) download: one sheet per section. Libraries are loaded on demand so they stay out of the main bundle. */
export async function downloadExcel(r: ReportResult, meta: string) {
  const XLSX = await import("xlsx");
  const book = XLSX.utils.book_new();
  r.sections.forEach((sec, n) => {
    const sheet = XLSX.utils.aoa_to_sheet([[r.title], [meta], [], sec.columns, ...sec.rows]);
    sheet["!cols"] = sec.columns.map((c, i) => ({ wch: Math.min(48, Math.max(c.length, ...sec.rows.map((row) => row[i]?.length ?? 0)) + 2) }));
    XLSX.utils.book_append_sheet(book, sheet, (sec.name || "Report").slice(0, 31) || `Sheet ${n + 1}`);
  });
  XLSX.writeFile(book, `${fileBase(r)}.xlsx`);
}

/** PDF download (landscape A4): each section is a table, one after the other. */
export async function downloadPdf(r: ReportResult, meta: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(16);
  doc.text(`Amber — ${r.title}`, 40, 42);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(meta, 40, 58);
  let y = 72;
  for (const sec of r.sections) {
    if (sec.name) {
      doc.setFontSize(11);
      doc.setTextColor(30);
      doc.text(sec.name, 40, y + 10);
      y += 16;
    }
    autoTable(doc, {
      startY: y,
      head: [sec.columns],
      body: sec.rows,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [15, 28, 56] },
      didDrawPage: () => {
        doc.setFontSize(8);
        doc.text(`Page ${doc.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 70, doc.internal.pageSize.getHeight() - 20);
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  }
  doc.save(`${fileBase(r)}.pdf`);
}
