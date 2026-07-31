import type { FabricSeason, FabricStretch } from "@/server/data/fabric-types";

// Невеликі фіксовані набори (season/stretch — pg-enum у схемі, значення задає
// розробник, не людина через попап) — UA-лейбли для UI.
export const FABRIC_SEASON_OPTIONS: { value: FabricSeason; label: string }[] = [
  { value: "spring", label: "Весна" },
  { value: "summer", label: "Літо" },
  { value: "autumn", label: "Осінь" },
  { value: "winter", label: "Зима" },
];

export const FABRIC_STRETCH_OPTIONS: { value: FabricStretch; label: string }[] = [
  { value: "low", label: "Низька" },
  { value: "medium", label: "Середня" },
  { value: "high", label: "Висока" },
];

export function seasonLabel(value: FabricSeason): string {
  return FABRIC_SEASON_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function stretchLabel(value: FabricStretch): string {
  return FABRIC_STRETCH_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
