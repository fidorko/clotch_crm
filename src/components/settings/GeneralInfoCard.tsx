"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { WarehouseWorkHoursField } from "@/components/settings/WarehouseWorkHoursField";
import type { GeneralSettingsRow } from "@/server/data/general-settings";
import type { GeneralSettingsWorkHourEntry } from "@/server/db/schema";
import { saveGeneralSettingsAction, type GeneralSettingsFormInput } from "@/app/settings/general/actions";

/**
 * «Основні дані» магазину (settings → Загальні, перша плитка, 70% ширини) —
 * автозбереження без кнопки «Зберегти» (conventions.md, той самий принцип,
 * що WarehouseForm): кожна зміна поля йде в БД через короткий debounce.
 * Один рядок на тенанта (singleton) — upsertGeneralSettings.
 */
export function GeneralInfoCard({ settings }: { settings: GeneralSettingsRow | null }) {
  const router = useRouter();
  const [, startSaving] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  const [name, setName] = useState(settings?.name ?? "");
  const [website, setWebsite] = useState(settings?.website ?? "");
  const [email, setEmail] = useState(settings?.email ?? "");
  const [contactPersonName, setContactPersonName] = useState(settings?.contactPersonName ?? "");
  const [contactPersonPosition, setContactPersonPosition] = useState(settings?.contactPersonPosition ?? "");
  const [contactPersonPhone, setContactPersonPhone] = useState(settings?.contactPersonPhone ?? "");
  const [workHours, setWorkHours] = useState<GeneralSettingsWorkHourEntry[]>(settings?.workHours ?? []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus("saving");
    setError(null);
    const input: GeneralSettingsFormInput = {
      name,
      website,
      email,
      contactPersonName,
      contactPersonPosition,
      contactPersonPhone,
      workHours,
    };
    const timeout = setTimeout(() => {
      startSaving(async () => {
        try {
          await saveGeneralSettingsAction(input);
          setSaveStatus("saved");
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Не вдалося зберегти");
          setSaveStatus("error");
        }
      });
    }, 500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- саме ці поля утворюють payload збереження
  }, [name, website, email, contactPersonName, contactPersonPosition, contactPersonPhone, workHours]);

  const statusMessage = { idle: null, saving: "Збереження…", saved: "Збережено", error: null }[saveStatus];

  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex flex-col gap-4 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Основні дані</h2>
          {(statusMessage || error) && (
            <span className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
              {error ?? statusMessage}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground" htmlFor="general-name">
              Назва
            </label>
            <Input
              id="general-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Мій магазин"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground" htmlFor="general-website">
              Сайт
            </label>
            <Input
              id="general-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground" htmlFor="general-email">
            Email
          </label>
          <Input
            id="general-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="shop@example.com"
            className="sm:w-1/2"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground" htmlFor="general-contact-name">
              Контактна особа
            </label>
            <Input
              id="general-contact-name"
              value={contactPersonName}
              onChange={(e) => setContactPersonName(e.target.value)}
              placeholder="Іваненко Іван"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground" htmlFor="general-contact-position">
              Посада
            </label>
            <Input
              id="general-contact-position"
              value={contactPersonPosition}
              onChange={(e) => setContactPersonPosition(e.target.value)}
              placeholder="Власник"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Телефон</label>
            <PhoneInput value={contactPersonPhone} onChange={setContactPersonPhone} />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <WarehouseWorkHoursField value={workHours} onChange={setWorkHours} />
        </div>
      </CardContent>
    </Card>
  );
}
