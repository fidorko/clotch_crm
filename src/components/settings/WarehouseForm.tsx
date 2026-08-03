"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { WarehouseWorkHoursField } from "@/components/settings/WarehouseWorkHoursField";
import { WarehouseFormHeader } from "@/components/settings/WarehouseFormHeader";
import { WAREHOUSE_TYPE_OPTIONS, type WarehouseType } from "@/lib/constants/warehouse-options";
import type { WarehouseFormInput, WarehouseWorkHourInput } from "@/lib/types/warehouse";
import type { WarehouseRow } from "@/server/data/warehouses";
import { createWarehouseAction, updateWarehouseAction } from "@/app/settings/warehouses/actions";

export function WarehouseForm({
  warehouse,
  countries,
  currencies,
}: {
  warehouse: WarehouseRow | null;
  countries: { id: string; name: string }[];
  currencies: { code: string; symbol: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Автозбереження лише для наявного складу (conventions.md, той самий
  // принцип, що CategoryForm) — на /new лишається явна кнопка "Створити склад".
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const isFirstRender = useRef(true);

  const [name, setName] = useState(warehouse?.name ?? "");
  const [type, setType] = useState<WarehouseType>((warehouse?.type as WarehouseType) ?? "main");
  const [isActive, setIsActive] = useState(warehouse?.isActive ?? true);
  const [responsiblePerson, setResponsiblePerson] = useState(warehouse?.responsiblePerson ?? "");
  const [responsiblePhone, setResponsiblePhone] = useState(warehouse?.responsiblePhone ?? "");
  const [country, setCountry] = useState(warehouse?.country ?? "");
  const [city, setCity] = useState(warehouse?.city ?? "");
  const [address, setAddress] = useState(warehouse?.address ?? "");
  const [notes, setNotes] = useState(warehouse?.notes ?? "");
  const [workHours, setWorkHours] = useState<WarehouseWorkHourInput[]>(warehouse?.workHours ?? []);
  const [currencyCode, setCurrencyCode] = useState(warehouse?.currencyCode ?? "");
  const [canSell, setCanSell] = useState(warehouse?.canSell ?? true);
  const [allowNegativeStock, setAllowNegativeStock] = useState(warehouse?.allowNegativeStock ?? false);
  const [useBinLocations, setUseBinLocations] = useState(warehouse?.useBinLocations ?? false);

  function buildInput(): WarehouseFormInput {
    return {
      name,
      type,
      isActive,
      responsiblePerson,
      responsiblePhone,
      country,
      city,
      address,
      notes,
      workHours,
      currencyCode,
      canSell,
      allowNegativeStock,
      useBinLocations,
    };
  }

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      try {
        const created = await createWarehouseAction(buildInput());
        router.push(`/settings/warehouses/${created.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти склад");
      }
    });
  }

  function saveExisting() {
    if (!warehouse) return;
    setSaveStatus("saving");
    startTransition(async () => {
      try {
        await updateWarehouseAction(warehouse.id, buildInput());
        setSaveStatus("saved");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти склад");
        setSaveStatus("error");
      }
    });
  }

  // Автозбереження — короткий debounce після останньої зміни (conventions.md,
  // той самий принцип, що CategoryForm/ProductEditorContext).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!warehouse) return;
    const timeout = setTimeout(saveExisting, 500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- саме ці поля утворюють payload saveExisting, warehouse стабільний
  }, [
    name,
    type,
    isActive,
    responsiblePerson,
    responsiblePhone,
    country,
    city,
    address,
    notes,
    workHours,
    currencyCode,
    canSell,
    allowNegativeStock,
    useBinLocations,
  ]);

  const primaryAction = warehouse
    ? undefined
    : { label: "Створити склад", onClick: handleCreate, disabled: isPending };
  const secondaryAction = {
    label: warehouse ? "До списку" : "Скасувати",
    onClick: () => router.push("/settings?tab=warehouses"),
  };
  const statusMessage = warehouse
    ? { idle: null, saving: "Збереження…", saved: "Збережено", error: null }[saveStatus]
    : null;
  const errorMessage = warehouse ? (saveStatus === "error" ? error : null) : error;

  return (
    <div className="flex flex-1 flex-col">
      <WarehouseFormHeader
        warehouse={warehouse}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
        statusMessage={statusMessage}
        errorMessage={errorMessage}
      />

      <div className="border-b border-border px-6 pt-3">
        <span className="inline-flex items-center gap-1.5 border-b-2 border-primary px-1.5 py-1 text-sm font-medium text-foreground">
          Основні налаштування
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-2">
        <Card className="gap-0 py-4">
          <CardContent className="flex flex-col gap-4 px-4">
            <h2 className="text-sm font-semibold text-foreground">Основні дані</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground" htmlFor="warehouse-name">
                  Назва складу *
                </label>
                <Input
                  id="warehouse-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Центральний склад"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground" htmlFor="warehouse-code">
                  Код складу *
                </label>
                <Input id="warehouse-code" value={warehouse?.code ?? "буде згенеровано"} disabled />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground">Тип складу</label>
                <Select value={type} onValueChange={(v) => v && setType(v as WarehouseType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v: string) => WAREHOUSE_TYPE_OPTIONS.find((o) => o.value === v)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {WAREHOUSE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-muted-foreground">Статус</span>
                <RadioGroup
                  value={isActive ? "active" : "inactive"}
                  onValueChange={(v) => setIsActive(v === "active")}
                  className="flex flex-row items-center gap-4 pt-1"
                >
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <RadioGroupItem value="active" />
                    Активний
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <RadioGroupItem value="inactive" />
                    Не активний
                  </label>
                </RadioGroup>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground" htmlFor="warehouse-responsible">
                  Матеріально відповідальна особа
                </label>
                <Input
                  id="warehouse-responsible"
                  value={responsiblePerson}
                  onChange={(e) => setResponsiblePerson(e.target.value)}
                  placeholder="Іваненко Олександр"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground">Телефон</label>
                <PhoneInput value={responsiblePhone} onChange={setResponsiblePhone} />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">Адреса складу</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-muted-foreground">Країна</label>
                  <Select value={country || undefined} onValueChange={(v) => setCountry(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{(v: string) => v}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {countries.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Немає значень у довіднику «Країни»
                        </div>
                      ) : (
                        countries.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-muted-foreground" htmlFor="warehouse-city">
                    Місто
                  </label>
                  <Input id="warehouse-city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground" htmlFor="warehouse-address">
                  Вулиця
                </label>
                <Input
                  id="warehouse-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="вул. Велика Кільцева, 4"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-4">
          <CardContent className="flex flex-col gap-4 px-4">
            <h2 className="text-sm font-semibold text-foreground">Коротко про склад</h2>

            <div className="flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-sm text-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                Після створення складу ви зможете згенерувати структуру комірок та надрукувати
                етикетки зі штрихкодами.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground" htmlFor="warehouse-notes">
                Примітки
              </label>
              <Textarea
                id="warehouse-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Основний склад для зберігання товарів та обробки замовлень."
                className="min-h-20"
              />
            </div>

            <WarehouseWorkHoursField value={workHours} onChange={setWorkHours} />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Валюта обліку</label>
              <Select value={currencyCode || undefined} onValueChange={(v) => setCurrencyCode(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: string) => v}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {currencies.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Немає валют у довіднику</div>
                  ) : (
                    currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={canSell} onCheckedChange={(v) => setCanSell(v === true)} />
              Можна продавати з цього складу
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={allowNegativeStock}
                onCheckedChange={(v) => setAllowNegativeStock(v === true)}
              />
              Дозволити від&apos;ємні залишки
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={useBinLocations}
                onCheckedChange={(v) => setUseBinLocations(v === true)}
              />
              Застосовувати адресне зберігання
            </label>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
