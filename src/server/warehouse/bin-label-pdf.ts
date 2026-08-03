import fs from "node:fs";
import path from "node:path";
import bwipjs from "bwip-js/node";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";

// Етикетка 101×101мм (макет людини) — по 5 комірок на сторінку, рівномірно
// розподілених по всій висоті (без "мертвого" відступу знизу), розділені
// горизонтальною лінією. У кожному рядку: назва зліва (жирний шрифт, кегль
// підганяється під висоту штрихкоду — не під усю висоту рядка, інакше текст
// домінує й тисне штрихкод до нечитабельної ширини), справжній Code128
// справа — разом на всю ширину сторінки.
const MM = 72 / 25.4;
const PAGE_SIZE = 101 * MM;
const ROWS_PER_PAGE = 5;
const ROW_HEIGHT = PAGE_SIZE / ROWS_PER_PAGE;
const MARGIN_X = 3 * MM;
const GAP = 3 * MM;
const BARCODE_HEIGHT = ROW_HEIGHT * 0.6;

// Значення вулиці/стелажу/комірки — довільний текст людини (кирилиця
// звичайна справа, "201 А 05"), стандартні 14 шрифтів pdf-lib кодують лише
// WinAnsi (латиниця) і падають на кирилиці. Inter — той самий шрифт, що й
// у UI (layout.tsx, підтримка кирилиці), вбудовується напряму через
// fontkit — файл на диску в репозиторії, не залежність-пакет (typeface-inter
// важить 15МБ усіх вагів, тут потрібен лише bold — назва на етикетці жирна
// за прямою вказівкою людини).
const BOLD_FONT_PATH = path.join(process.cwd(), "src/server/warehouse/fonts/Inter-Bold.woff2");

export async function buildBinLabelsPdf(cells: { code: string; barcode: string }[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const boldFont = await pdf.embedFont(fs.readFileSync(BOLD_FONT_PATH));

  // Кегль назви = висота штрихкоду (за прямою вказівкою людини) — однаковий
  // для всіх рядків, а не підлаштований під висоту рядка.
  const fontSize = boldFont.sizeAtHeight(BARCODE_HEIGHT);

  for (let i = 0; i < cells.length; i += ROWS_PER_PAGE) {
    const page = pdf.addPage([PAGE_SIZE, PAGE_SIZE]);
    const batch = cells.slice(i, i + ROWS_PER_PAGE);

    for (let row = 0; row < batch.length; row++) {
      const cell = batch[row];
      const rowTop = PAGE_SIZE - row * ROW_HEIGHT;
      const rowCenterY = rowTop - ROW_HEIGHT / 2;

      const png = await bwipjs.toBuffer({
        bcid: "code128",
        text: cell.barcode,
        scale: 2,
        height: 8,
        includetext: false,
        backgroundcolor: "FFFFFF",
      });
      const barcodeImage = await pdf.embedPng(png);

      const textWidth = boldFont.widthOfTextAtSize(cell.code, fontSize);
      const barcodeAreaX = MARGIN_X + textWidth + GAP;
      const barcodeAreaWidth = Math.max(PAGE_SIZE - MARGIN_X - barcodeAreaX, 10 * MM);
      const scaled = barcodeImage.scaleToFit(barcodeAreaWidth, BARCODE_HEIGHT);

      page.drawText(cell.code, {
        x: MARGIN_X,
        y: rowCenterY - fontSize * 0.35,
        size: fontSize,
        font: boldFont,
      });

      page.drawImage(barcodeImage, {
        x: PAGE_SIZE - MARGIN_X - scaled.width,
        y: rowCenterY - scaled.height / 2,
        width: scaled.width,
        height: scaled.height,
      });

      if (row < batch.length - 1) {
        page.drawLine({
          start: { x: 0, y: rowTop - ROW_HEIGHT },
          end: { x: PAGE_SIZE, y: rowTop - ROW_HEIGHT },
          thickness: 0.5,
          color: rgb(0.7, 0.7, 0.7),
        });
      }
    }
  }

  return pdf.save();
}
