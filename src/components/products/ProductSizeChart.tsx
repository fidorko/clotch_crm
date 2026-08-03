"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProductEditor } from "@/components/products/ProductEditorContext";

interface MeasurementPoint {
  id: string;
  label: string;
}

/**
 * Розмірна сітка — рядки беруться з розмірів, реально доданих у конструкторі
 * SKU (ProductSkuSection, вкладка «Основне»), колонки — з точок заміру типів,
 * закріплених за категорією товару (measurement-type:*, той самий принцип, що
 * sizeOptions у page.tsx). Значення на перетині зберігаються разом з рештою
 * форми товару (form.sizeMeasurements, ProductEditorContext) — одна кнопка
 * «Зберегти» в ProductHeader. Раніше — статична захардкоджена таблиця
 * (9 розмірів × 6 фіксованих замірів), не пов'язана ні з товаром, ні з
 * категорією (decisions.md).
 */
export function ProductSizeChart({
  sizes,
  measurementPoints,
}: {
  sizes: string[];
  measurementPoints: MeasurementPoint[];
}) {
  const { form, setField } = useProductEditor();

  function valueAt(size: string, measurementValueId: string): string {
    const entry = form.sizeMeasurements.find(
      (m) => m.size === size && m.measurementValueId === measurementValueId
    );
    return entry ? String(entry.valueCm) : "";
  }

  function setValueAt(size: string, measurementValueId: string, raw: string) {
    const valueCm = raw === "" ? null : Number(raw);
    const rest = form.sizeMeasurements.filter(
      (m) => !(m.size === size && m.measurementValueId === measurementValueId)
    );
    setField(
      "sizeMeasurements",
      valueCm === null || Number.isNaN(valueCm) ? rest : [...rest, { size, measurementValueId, valueCm }]
    );
  }

  return (
    <Card className="h-full gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-medium">Розмірна сітка</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        {sizes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Спочатку додайте розміри в конструкторі SKU (вкладка «Основне»).
          </p>
        ) : measurementPoints.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            У категорії цього товару не закріплено жодного типу замірів — див. «Закріплення характеристик»
            на сторінці категорії.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Розмір</TableHead>
                  {measurementPoints.map((point) => (
                    <TableHead key={point.id} className="text-center">
                      {point.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sizes.map((size) => (
                  <TableRow key={size} className="hover:bg-transparent">
                    <TableCell className="font-medium text-foreground">{size}</TableCell>
                    {measurementPoints.map((point) => (
                      <TableCell key={point.id} className="text-center">
                        <DecimalInput
                          value={valueAt(size, point.id)}
                          onChange={(value) => setValueAt(size, point.id, value)}
                          placeholder="см"
                          className="h-8 w-20 text-center"
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
