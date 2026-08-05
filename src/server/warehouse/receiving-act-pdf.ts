import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";

// A4, той самий підхід кирилиці, що bin-label-pdf.ts (Inter, fontkit, файл
// на диску в репозиторії). Наразі є лише Inter-Bold.woff2 — regular-вагу не
// вдалось додати в цьому проході (нема надійного джерела бінарного файлу
// шрифту в сесії), тому увесь текст акту жирний. Відкритий пункт —
// warehouse-receiving.md.
const MM = 72 / 25.4;
const PAGE_WIDTH = 210 * MM;
const PAGE_HEIGHT = 297 * MM;
const MARGIN = 18 * MM;
const FONT_PATH = path.join(process.cwd(), "src/server/warehouse/fonts/Inter-Bold.woff2");

// Отримувач — мок-плейсхолдер (пряме рішення людини: реальні дані
// прийдуть із майбутніх налаштувань магазину, warehouse-receiving.md).
const MOCK_RECEIVER_NAME = "ТОВ «Назва магазину»";
const MOCK_RECEIVER_ADDRESS = "Юридична адреса — з налаштувань магазину (заглушка)";

export interface ReceivingActItem {
  productName: string;
  color: string;
  size: string;
  ordered: number;
  received: number;
}

export interface ReceivingActInput {
  documentNumber: string;
  isPlanned: boolean;
  supplierName: string | null;
  warehouseName: string | null;
  responsiblePerson: string | null;
  completedAtLabel: string;
  items: ReceivingActItem[];
}

// Єдине джерело поточної позиції — і текстові рядки шапки, і таблиця
// позицій пишуть через той самий курсор, щоб перехід на нову сторінку
// (ensureSpace) ніколи не розходився з локальним станом виклику.
class PdfCursor {
  page: import("pdf-lib").PDFPage;
  y: number;

  constructor(
    private readonly pdf: PDFDocument,
    private readonly font: PDFFont
  ) {
    this.page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private newPage() {
    this.page = this.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  ensureSpace(height: number) {
    if (this.y - height < MARGIN) this.newPage();
  }

  text(value: string, size: number, x = MARGIN) {
    this.page.drawText(value, { x, y: this.y - size, size, font: this.font, color: rgb(0, 0, 0) });
  }

  advance(amount: number) {
    this.y -= amount;
  }

  line(x1: number, x2: number) {
    this.page.drawLine({
      start: { x: x1, y: this.y },
      end: { x: x2, y: this.y },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    });
  }
}

export async function buildReceivingActPdf(input: ReceivingActInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fs.readFileSync(FONT_PATH));
  const cursor = new PdfCursor(pdf, font);

  cursor.ensureSpace(20);
  cursor.text("Акт приймання-передачі", 18);
  cursor.advance(24);

  cursor.ensureSpace(13);
  cursor.text(`Документ №${input.documentNumber} від ${input.completedAtLabel}`, 11);
  cursor.advance(22);

  for (const line of [
    `Постачальник: ${input.supplierName ?? "—"}`,
    `Відповідальна особа: ${input.responsiblePerson ?? "—"}`,
    `Склад: ${input.warehouseName ?? "—"}`,
    `Отримувач: ${MOCK_RECEIVER_NAME}`,
  ]) {
    cursor.ensureSpace(13);
    cursor.text(line, 11);
    cursor.advance(15);
  }
  cursor.ensureSpace(11);
  cursor.text(MOCK_RECEIVER_ADDRESS, 9);
  cursor.advance(24);

  drawItemsTable(cursor, input);

  return pdf.save();
}

// Проста таблиця, намальована вручну (pdf-lib не має табличного API) —
// той самий принцип "малюємо самі", що bin-label-pdf.ts. Колонка
// «Розбіжність» лише для планового — для простого надходження нема бази
// для порівняння (усе, що прийнято, і є фактом).
function drawItemsTable(cursor: PdfCursor, input: ReceivingActInput) {
  const rowHeight = 16;
  const headerSize = 9;
  const rowSize = 9;
  const columns = input.isPlanned
    ? [
        { label: "Товар", width: 0.55 },
        { label: "План", width: 0.15 },
        { label: "Факт", width: 0.15 },
        { label: "Розбіжність", width: 0.15 },
      ]
    : [
        { label: "Товар", width: 0.75 },
        { label: "Прийнято", width: 0.25 },
      ];
  const tableWidth = PAGE_WIDTH - MARGIN * 2;

  function columnX(index: number): number {
    let x = MARGIN;
    for (let i = 0; i < index; i++) x += columns[i].width * tableWidth;
    return x;
  }

  function drawHeaderRow() {
    cursor.ensureSpace(rowHeight * 2);
    columns.forEach((col, i) => cursor.text(col.label, headerSize, columnX(i) + 2));
    cursor.advance(rowHeight);
    cursor.line(MARGIN, MARGIN + tableWidth);
    cursor.advance(4);
  }

  drawHeaderRow();

  for (const item of input.items) {
    cursor.ensureSpace(rowHeight);
    const label = `${item.productName}, ${item.color}, ${item.size}`;
    const discrepancy = item.received - item.ordered;
    const discrepancyLabel = discrepancy === 0 ? "0" : discrepancy > 0 ? `+${discrepancy}` : `${discrepancy}`;

    cursor.text(label, rowSize, columnX(0) + 2);
    if (input.isPlanned) {
      cursor.text(String(item.ordered), rowSize, columnX(1) + 2);
      cursor.text(String(item.received), rowSize, columnX(2) + 2);
      cursor.text(discrepancyLabel, rowSize, columnX(3) + 2);
    } else {
      cursor.text(String(item.received), rowSize, columnX(1) + 2);
    }
    cursor.advance(rowHeight);
  }

  if (input.items.length === 0) {
    cursor.ensureSpace(rowHeight);
    cursor.text("Немає позицій", rowSize, MARGIN);
    cursor.advance(rowHeight);
  }
}
