/**
 * Відкриває base64 PDF (server action, printDocuments()) у новій вкладці
 * через blob-URL — на відміну від прямого посилання на my.novaposhta.ua,
 * тут в адресному рядку/історії браузера не світиться apiKey перевізника
 * (docs/carriers/novaposhta/printing.md).
 */
export function openPdfBlob(pdfBase64: string): void {
  const bytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
}
