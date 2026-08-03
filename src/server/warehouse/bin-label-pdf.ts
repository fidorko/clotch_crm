import bwipjs from "bwip-js/node";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Етикетка 101×101мм (макет людини) — по 5 комірок на сторінку (18мм кожна),
// розділені горизонтальною лінією. Штрихкод — справжній Code128 (bwip-js,
// рендер PNG на сервері без DOM), значення = унікальний code комірки в БД,
// тож будь-який сканер зчитує і одразу знаходить комірку через resolveCellsForPrint.
const MM = 72 / 25.4;
const PAGE_SIZE = 101 * MM;
const ROW_HEIGHT = 18 * MM;
const ROWS_PER_PAGE = 5;
const MARGIN_X = 4 * MM;

export async function buildBinLabelsPdf(cells: { code: string; barcode: string }[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < cells.length; i += ROWS_PER_PAGE) {
    const page = pdf.addPage([PAGE_SIZE, PAGE_SIZE]);
    const batch = cells.slice(i, i + ROWS_PER_PAGE);

    for (let row = 0; row < batch.length; row++) {
      const cell = batch[row];
      const rowTop = PAGE_SIZE - row * ROW_HEIGHT;
      const rowBottom = rowTop - ROW_HEIGHT;

      const png = await bwipjs.toBuffer({
        bcid: "code128",
        text: cell.barcode,
        scale: 2,
        height: 8,
        includetext: false,
        backgroundcolor: "FFFFFF",
      });
      const barcodeImage = await pdf.embedPng(png);
      const scaled = barcodeImage.scaleToFit(PAGE_SIZE - MARGIN_X * 2, ROW_HEIGHT * 0.45);

      page.drawText(cell.code, {
        x: MARGIN_X,
        y: rowTop - 12,
        size: 10,
        font,
      });

      page.drawImage(barcodeImage, {
        x: MARGIN_X,
        y: rowBottom + (ROW_HEIGHT - scaled.height) / 2 - 3,
        width: scaled.width,
        height: scaled.height,
      });

      if (row < batch.length - 1) {
        page.drawLine({
          start: { x: 0, y: rowBottom },
          end: { x: PAGE_SIZE, y: rowBottom },
          thickness: 0.5,
          color: rgb(0.7, 0.7, 0.7),
        });
      }
    }
  }

  return pdf.save();
}
