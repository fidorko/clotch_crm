import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Тимчасова довідникова таблиця (уніфікована, не прив'язана до товару). Планово — довідник з БД.
const SIZE_CHART_ROWS = [
  { size: "XS", chest: "82-86", waist: "62-66", hips: "88-92", intJeans: "25/26", uaRu: "42", eu: "34" },
  { size: "S", chest: "86-90", waist: "68-70", hips: "92-96", intJeans: "27", uaRu: "44", eu: "36" },
  { size: "M", chest: "90-94", waist: "70-74", hips: "96-100", intJeans: "28/29", uaRu: "46", eu: "38" },
  { size: "L", chest: "94-98", waist: "74-78", hips: "100-104", intJeans: "29/30", uaRu: "48", eu: "40" },
  { size: "XL", chest: "99-104", waist: "79-84", hips: "105-110", intJeans: "31/32", uaRu: "50", eu: "42/44" },
  { size: "2XL", chest: "104-108", waist: "84-88", hips: "110-114", intJeans: "32/36", uaRu: "52", eu: "44" },
  { size: "3XL", chest: "108-112", waist: "88-92", hips: "114-118", intJeans: "38/40", uaRu: "54", eu: "48" },
  { size: "4XL", chest: "112-116", waist: "92-96", hips: "118-122", intJeans: "40/42", uaRu: "56", eu: "50" },
  { size: "5XL", chest: "116-120", waist: "96-100", hips: "122-126", intJeans: "42/44", uaRu: "58", eu: "50" },
] as const;

export function ProductSizeChart() {
  return (
    <Card className="h-full gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-medium">Розмірна сітка</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Міжнародний розмір, NT</TableHead>
                <TableHead className="text-center">Обхват грудей</TableHead>
                <TableHead className="text-center">Обхват талії</TableHead>
                <TableHead className="text-center">Обхват стегон</TableHead>
                <TableHead className="text-center">INT (джинси)</TableHead>
                <TableHead className="text-center">UA/RU</TableHead>
                <TableHead className="text-center">EU</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SIZE_CHART_ROWS.map((row) => (
                <TableRow key={row.size} className="hover:bg-transparent">
                  <TableCell className="font-medium text-foreground">{row.size}</TableCell>
                  <TableCell className="text-center">{row.chest}</TableCell>
                  <TableCell className="text-center">{row.waist}</TableCell>
                  <TableCell className="text-center">{row.hips}</TableCell>
                  <TableCell className="text-center">{row.intJeans}</TableCell>
                  <TableCell className="text-center">{row.uaRu}</TableCell>
                  <TableCell className="text-center">{row.eu}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
