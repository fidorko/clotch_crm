import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DiagramKind = "chest" | "waist" | "hips" | "shoulders" | "sleeve" | "length" | "inseam" | "foot" | "generic";

// Best-effort збіг за ключовим словом у назві точки заміру (те саме, що
// CharacteristicIcon для характеристик, lib/categories/characteristic-icons.tsx)
// — точки заміру вводить власник магазину вільним текстом (measurement_values),
// точного довідника-джерела для ілюстрації нема, тож підбираємо схему за
// смислом назви, а не по строгому id.
function matchDiagramKind(label: string): DiagramKind {
  const l = label.toLowerCase();
  if (l.includes("стопи") || l.includes("взуття")) return "foot";
  if (l.includes("плеч")) return "shoulders";
  if (l.includes("рукав")) return "sleeve";
  if (l.includes("внутрішньому шву")) return "inseam";
  if (l.includes("груд")) return "chest";
  if (l.includes("тал")) return "waist";
  if (l.includes("стег")) return "hips";
  if (l.includes("виробу") || l.includes("довжина") || l.includes("зріст")) return "length";
  return "generic";
}

// Спільний контур фігури (спереду, руки трохи розведені) — той самий шлях
// у кожній схемі, підсвічується лише потрібна ділянка/лінія.
const BODY_OUTLINE =
  "M30 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM22 17h16l4 4-3 20-3-2-2 30h-8l-2-30-3 2-3-20z" +
  "M22 17l-9 8 3 16 4-2-3-18zM38 17l9 8-3 16-4-2 3-18z" +
  "M25 69l-3 27h5l3-25zM35 69l3 27h-5l-3-25z";

function Highlight({ kind }: { kind: DiagramKind }) {
  switch (kind) {
    case "chest":
      return <ellipse cx="30" cy="26" rx="11" ry="3" className="fill-none stroke-primary" strokeDasharray="2 2" strokeWidth="1.5" />;
    case "waist":
      return <ellipse cx="30" cy="38" rx="8.5" ry="2.5" className="fill-none stroke-primary" strokeDasharray="2 2" strokeWidth="1.5" />;
    case "hips":
      return <ellipse cx="30" cy="47" rx="9.5" ry="3" className="fill-none stroke-primary" strokeDasharray="2 2" strokeWidth="1.5" />;
    case "shoulders":
      return <line x1="13" y1="19" x2="47" y2="19" className="stroke-primary" strokeDasharray="2 2" strokeWidth="1.5" />;
    case "sleeve":
      return <path d="M31 19l17 6-3 17" className="fill-none stroke-primary" strokeDasharray="2 2" strokeWidth="1.5" />;
    case "length":
      return <line x1="16" y1="21" x2="16" y2="95" className="stroke-primary" strokeDasharray="2 2" strokeWidth="1.5" />;
    case "inseam":
      return <line x1="30" y1="60" x2="30" y2="96" className="stroke-primary" strokeDasharray="2 2" strokeWidth="1.5" />;
    case "foot":
      return null;
    default:
      return null;
  }
}

function FootDiagram() {
  return (
    <svg viewBox="0 0 60 40" className="size-10 shrink-0">
      <path
        d="M10 30c0-10 2-18 8-22 4-3 8 0 10 5 3 7 8 9 15 10 5 1 7 4 7 7 0 4-4 6-10 6H16c-4 0-6-2-6-6z"
        className="fill-none stroke-muted-foreground"
        strokeWidth="1.5"
      />
      <path d="M18 12c2 4 3 10 2 18" className="fill-none stroke-primary" strokeDasharray="2 2" strokeWidth="1.5" />
    </svg>
  );
}

function BodyDiagram({ kind }: { kind: DiagramKind }) {
  return (
    <svg viewBox="0 0 60 100" className="size-10 shrink-0">
      <path d={BODY_OUTLINE} className="fill-none stroke-muted-foreground" strokeWidth="1.5" />
      <Highlight kind={kind} />
    </svg>
  );
}

/**
 * "Довідка" на місці колишньої ProductMeasurements (decisions.md) — не форма
 * вводу (значення тепер вводяться на перетині в сітці ProductSizeChart), а
 * ілюстрація, де саме на виробі береться кожна закріплена за категорією точка
 * заміру. Схематична, не технічна викрійка — best-effort за ключовим словом.
 */
export function MeasurementGuide({ points }: { points: { id: string; label: string }[] }) {
  return (
    <Card className="h-full gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-medium">Схема замірів</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        {points.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            У категорії цього товару не закріплено жодного типу замірів — див. «Закріплення характеристик» на
            сторінці категорії.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {points.map((point) => {
              const kind = matchDiagramKind(point.label);
              return (
                <div key={point.id} className="flex items-center gap-3 py-2.5">
                  {kind === "foot" ? <FootDiagram /> : <BodyDiagram kind={kind} />}
                  <span className="text-sm text-foreground">{point.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
