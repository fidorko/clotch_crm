export interface MeasurementTypeOption {
  id: string;
  label: string;
  imageUrl: string;
}

// Тимчасовий довідник типів замірів. Планово — довідник з БД.
// imageUrl — зображення-візуалізація (що саме міряти), своє на кожен тип. Поки порожньо — заглушка в UI.
export const MEASUREMENT_TYPE_OPTIONS: MeasurementTypeOption[] = [
  { id: "front-length", label: "Довжина переду виробу, см", imageUrl: "" },
  { id: "back-length", label: "Довжина спинки виробу, см", imageUrl: "" },
  { id: "sleeve-from-collar", label: "Довжина рукава від горловини, см", imageUrl: "" },
  { id: "sleeve-inseam", label: "Довжина рукава по внутрішньому шву, см", imageUrl: "" },
  { id: "chest-width", label: "Ширина під проймами рукавів (над грудьми), см", imageUrl: "" },
  { id: "hem-width", label: "Ширина низу виробу, см", imageUrl: "" },
  { id: "neck-girth", label: "Обхват горловини, см", imageUrl: "" },
  { id: "waist-girth", label: "Обхват талії, см", imageUrl: "" },
];
