import {
  Award,
  BookOpen,
  CalendarDays,
  Factory,
  Globe,
  Layers,
  Palette,
  Ruler,
  Scissors,
  Shirt,
  Sparkles,
  Tag,
  Truck,
  UserRound,
} from "lucide-react";
import type { CategoryCharacteristicOption } from "./characteristic-options";

// Best-effort іконка на характеристику для картки/рядка (CategoryCharacteristicsPicker,
// за макетом-скріном людини). Фіксовані ключі (colors/fabric-materials/...) мають
// точну іконку; довільні custom_characteristics (людина сама вигадує назву в попапі,
// напр. "Стиль"/"Посадка"/"Крій") — за ключовим словом у назві, без гарантії влучності,
// fallback — Tag. Суто візуальне полегшення сканування списку, не частина моделі даних.
// Повертає готовий елемент (не компонент-посилання) — react-hooks/static-components
// забороняє зберігати компонент у змінній й рендерити як `<Icon/>` під час рендеру.
export function CharacteristicIcon({
  option,
  className,
}: {
  option: CategoryCharacteristicOption;
  className?: string;
}) {
  const { key, label } = option;
  if (key === "colors") return <Palette className={className} />;
  if (key === "fabric-materials") return <Shirt className={className} />;
  if (key === "care-instructions") return <BookOpen className={className} />;
  if (key.startsWith("size-type:") || key.startsWith("measurement-type:"))
    return <Ruler className={className} />;
  if (key === "reference-item:manufacturers") return <Factory className={className} />;
  if (key === "reference-item:brand-country" || key === "reference-item:country-of-origin")
    return <Globe className={className} />;
  if (key === "suppliers") return <Truck className={className} />;

  if (/тег/i.test(label)) return <Tag className={className} />;
  if (/стил/i.test(label)) return <Shirt className={className} />;
  if (/посадк/i.test(label)) return <UserRound className={className} />;
  if (/сезон/i.test(label)) return <CalendarDays className={className} />;
  if (/бренд/i.test(label)) return <Award className={className} />;
  if (/кр[ої]й/i.test(label)) return <Scissors className={className} />;
  if (/особлив/i.test(label)) return <Sparkles className={className} />;
  if (/колекц/i.test(label)) return <Layers className={className} />;
  return <Tag className={className} />;
}
