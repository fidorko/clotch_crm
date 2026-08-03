// Макет етикетки комірки — лише перегляд (без друку/експорту), детермінований
// візуальний штрихкод/QR із рядка адреси (не справжня символіка Code128/QR,
// немає бібліотеки для реального рендеру — чесно позначено як макет).
function barWidths(value: string): number[] {
  const padded = value.padEnd(16, "0");
  return Array.from(padded).map((ch) => (ch.charCodeAt(0) % 3) + 1);
}

function BarcodeStripe({ value }: { value: string }) {
  return (
    <div className="flex h-10 items-stretch gap-0.5 rounded bg-white p-1.5">
      {barWidths(value).map((w, i) => (
        <div key={i} className="bg-foreground" style={{ width: `${w * 2}px` }} />
      ))}
    </div>
  );
}

function QrPlaceholder({ value }: { value: string }) {
  const size = 7;
  const cells = Array.from({ length: size * size }, (_, i) => value.charCodeAt(i % value.length) % 2 === 0);
  const isFinder = (row: number, col: number) =>
    (row < 2 && col < 2) || (row < 2 && col > size - 3) || (row > size - 3 && col < 2);

  return (
    <div className="grid size-16 shrink-0 grid-cols-7 gap-px rounded bg-white p-1">
      {cells.map((filled, i) => {
        const row = Math.floor(i / size);
        const col = i % size;
        return (
          <div
            key={i}
            className={isFinder(row, col) || filled ? "bg-foreground" : "bg-transparent"}
          />
        );
      })}
    </div>
  );
}

export function WarehouseBinLabelPreview({
  code,
  showBarcode,
  showQr,
}: {
  code: string;
  showBarcode: boolean;
  showQr: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-3">
      <span className="text-center font-mono text-base font-semibold text-foreground">{code}</span>
      <div className="flex items-center justify-center gap-3">
        {showBarcode && <BarcodeStripe value={code} />}
        {showQr && <QrPlaceholder value={code} />}
      </div>
    </div>
  );
}
