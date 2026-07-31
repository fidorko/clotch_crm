import {
  Ban,
  CircleSlash,
  Droplet,
  DropletOff,
  Flame,
  Shirt,
  Snowflake,
  Sparkles,
  Sun,
  ThermometerSun,
  WashingMachine,
  Wind,
  type LucideIcon,
} from "lucide-react";

// Фіксований набір іконок-кандидатів для пікера при створенні запису
// "Інструкція по догляду" (care_instructions.icon зберігає лише цей ключ,
// текстом — сам запис, назва й вибір іконки, повністю в БД, тенант-керовано).
export const CARE_INSTRUCTION_ICON_OPTIONS: { key: string; icon: LucideIcon; label: string }[] = [
  { key: "washing-machine", icon: WashingMachine, label: "Пральна машина" },
  { key: "droplet", icon: Droplet, label: "Ручне прання" },
  { key: "droplet-off", icon: DropletOff, label: "Не прати" },
  { key: "snowflake", icon: Snowflake, label: "Холодна вода" },
  { key: "flame", icon: Flame, label: "Прасування" },
  { key: "ban", icon: Ban, label: "Заборонено" },
  { key: "circle-slash", icon: CircleSlash, label: "Не відбілювати" },
  { key: "wind", icon: Wind, label: "Сушіння в барабані / на повітрі" },
  { key: "sun", icon: Sun, label: "Сушіння на сонці" },
  { key: "sparkles", icon: Sparkles, label: "Хімчистка" },
  { key: "thermometer-sun", icon: ThermometerSun, label: "Температурний режим" },
  { key: "shirt", icon: Shirt, label: "Загальний догляд" },
];

const ICON_BY_KEY = new Map(CARE_INSTRUCTION_ICON_OPTIONS.map((opt) => [opt.key, opt.icon]));

export function getCareInstructionIcon(key: string): LucideIcon {
  return ICON_BY_KEY.get(key) ?? Shirt;
}
