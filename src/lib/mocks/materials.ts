import type { materialCategoryEnum } from "@/server/db/schema/materials";

export type MaterialCategory = (typeof materialCategoryEnum.enumValues)[number];

export interface MockMaterial {
  name: string;
  category: MaterialCategory;
}

// Джерело для `db:seed` — за прямим списком людини, з розбивкою по категоріях.
// Дедуп: "Штучна шкіра" дублювалась двічі в категорії "Шкіра" (лишена один раз);
// "ПВХ" фігурувала і в "Синтетичні", і в "Гума та подібні матеріали" — оскільки
// назва унікальна на тенант незалежно від категорії (UNIQUE(tenant_id, name)),
// лишена лише в першій ("Синтетичні").
export const mockMaterials: MockMaterial[] = [
  { name: "Бавовна", category: "natural" },
  { name: "Органічна бавовна", category: "natural" },
  { name: "Льон", category: "natural" },
  { name: "Конопля", category: "natural" },
  { name: "Вовна", category: "natural" },
  { name: "Мериносова вовна", category: "natural" },
  { name: "Кашемір", category: "natural" },
  { name: "Альпака", category: "natural" },
  { name: "Мохер", category: "natural" },
  { name: "Ангора", category: "natural" },
  { name: "Верблюжа вовна", category: "natural" },
  { name: "Шовк", category: "natural" },

  { name: "Віскоза", category: "cellulose" },
  { name: "Модал", category: "cellulose" },
  { name: "Ліоцел", category: "cellulose" },
  { name: "Купро", category: "cellulose" },
  { name: "Ацетат", category: "cellulose" },
  { name: "Триацетат", category: "cellulose" },
  { name: "Бамбукове волокно", category: "cellulose" },

  { name: "Поліестер", category: "synthetic" },
  { name: "Перероблений поліестер", category: "synthetic" },
  { name: "Поліамід", category: "synthetic" },
  { name: "Нейлон", category: "synthetic" },
  { name: "Акрил", category: "synthetic" },
  { name: "Еластан", category: "synthetic" },
  { name: "Спандекс", category: "synthetic" },
  { name: "Лайкра", category: "synthetic" },
  { name: "Поліпропілен", category: "synthetic" },
  { name: "Поліетилен", category: "synthetic" },
  { name: "Поліуретан", category: "synthetic" },
  { name: "ПВХ", category: "synthetic" },
  { name: "Неопрен", category: "synthetic" },
  { name: "Мікрофібра", category: "synthetic" },

  { name: "Натуральна шкіра", category: "leather" },
  { name: "Гладка шкіра", category: "leather" },
  { name: "Зерниста шкіра", category: "leather" },
  { name: "Лакована шкіра", category: "leather" },
  { name: "Замша", category: "leather" },
  { name: "Нубук", category: "leather" },
  { name: "Спилок", category: "leather" },
  { name: "Штучна шкіра", category: "leather" },
  { name: "Екошкіра", category: "leather" },
  { name: "Штучна замша", category: "leather" },

  { name: "Натуральне хутро", category: "fur" },
  { name: "Штучне хутро", category: "fur" },

  { name: "Гума", category: "rubber" },
  { name: "Термопластична гума (TPR)", category: "rubber" },
  { name: "Термополіуретан (TPU)", category: "rubber" },
  { name: "EVA", category: "rubber" },
  { name: "Піна EVA", category: "rubber" },

  { name: "Корок", category: "other" },
  { name: "Повсть", category: "other" },
  { name: "Фетр", category: "other" },
  { name: "Латекс", category: "other" },
  { name: "Силікон", category: "other" },
];
