import ExcelJS from "exceljs";

export const runtime = "nodejs";

/**
 * Parses a dropped .xlsx/.xls workbook into header-keyed string rows — the same
 * shape `parseCsv` produces — so the client can feed it straight into
 * `rowsToAssets`. Uses the first worksheet; row 1 is treated as the header row.
 */
export async function POST(request: Request) {
  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return Response.json(
      { error: "Expected a multipart form with a 'file' field." },
      { status: 400 },
    );
  }

  if (!file) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    return Response.json({ error: "Could not read the Excel file." }, { status: 400 });
  }

  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 1) {
    return Response.json({ error: "The workbook has no worksheet data." }, { status: 400 });
  }

  const cellText = (cell: ExcelJS.Cell): string => (cell?.text ?? "").toString().trim();

  const colCount = sheet.columnCount;
  const headers: string[] = [];
  const headerRow = sheet.getRow(1);
  for (let c = 1; c <= colCount; c++) {
    headers[c - 1] = cellText(headerRow.getCell(c));
  }

  const rows: Record<string, string>[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const obj: Record<string, string> = {};
    let hasValue = false;
    for (let c = 1; c <= colCount; c++) {
      const header = headers[c - 1];
      if (!header) continue;
      const value = cellText(row.getCell(c));
      if (value !== "") hasValue = true;
      obj[header] = value;
    }
    if (hasValue) rows.push(obj);
  }

  return Response.json({ rows });
}
