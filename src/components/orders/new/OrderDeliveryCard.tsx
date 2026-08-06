"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NpSearchCombobox } from "@/components/carriers/NpSearchCombobox";
import {
  searchDeliveryCitiesAction,
  searchDeliveryWarehousesAction,
} from "@/app/settings/delivery/np-lookup-actions";
import type { DeliveryMethodRow } from "@/server/data/delivery-methods";
import type { DeliveryMethodEntitySettingsRow } from "@/server/data/delivery-method-entity-settings";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}

export interface OrderDeliveryValues {
  deliveryMethodId: string;
  recipientName: string;
  recipientPhone: string;
  recipientCityRef: string;
  recipientCity: string;
  recipientWarehouseRef: string;
  recipientWarehouse: string;
  weightKg: string;
  seatsAmount: string;
  declaredValue: string;
  description: string;
  createShipmentNow: boolean;
}

/**
 * Доставка — вибір реального способу тенанта (settings → Доставка). Для
 * Нової пошти показує реальний пошук міста/відділення отримувача (той самий
 * `NpSearchCombobox`, що відправник у settings-delivery.md) з тенантським
 * ключем цього способу доставки — і чекбокс "Створити ЕН одразу" (реальний
 * виклик `InternetDocument.save`, docs/carriers/novaposhta/shipments.md).
 * Відправник/платник/опис вантажу беруться з налаштувань способу доставки —
 * тут лише те, що специфічне для КОНКРЕТНОГО замовлення (вага, місця,
 * отримувач).
 */
export function OrderDeliveryCard({
  values,
  onChange,
  deliveryMethods,
  entitySettingsByMethodId,
  orderTotal,
}: {
  values: OrderDeliveryValues;
  onChange: (patch: Partial<OrderDeliveryValues>) => void;
  deliveryMethods: DeliveryMethodRow[];
  entitySettingsByMethodId: Record<string, DeliveryMethodEntitySettingsRow>;
  orderTotal: number;
}) {
  const selected = deliveryMethods.find((m) => m.id === values.deliveryMethodId) ?? null;
  const selectedEntitySettings = selected ? entitySettingsByMethodId[selected.id] : undefined;
  const isNovaPoshta = selected?.carrierKey === "nova_poshta";
  const senderReady = Boolean(
    selectedEntitySettings?.senderCounterpartyRef &&
      selectedEntitySettings?.senderContactPersonRef &&
      selectedEntitySettings?.senderWarehouseRef
  );

  function handleCityChange(item: { ref: string; name: string }) {
    onChange({
      recipientCityRef: item.ref,
      recipientCity: item.name,
      recipientWarehouseRef: "",
      recipientWarehouse: "",
    });
  }

  return (
    <Card className="gap-3 p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        <span className="text-lg font-semibold text-foreground">Доставка</span>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Спосіб доставки</FieldLabel>
          <Select
            value={values.deliveryMethodId}
            onValueChange={(v) =>
              onChange({
                deliveryMethodId: v ?? "",
                recipientCityRef: "",
                recipientCity: "",
                recipientWarehouseRef: "",
                recipientWarehouse: "",
                declaredValue: orderTotal.toFixed(2),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>{() => selected?.name ?? "Оберіть спосіб доставки"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {deliveryMethods.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected && !isNovaPoshta && (
          <p className="text-xs text-muted-foreground">
            Реальне створення ЕН підключено поки лише для Нової пошти — для «{selected.name}» доставку фіксуємо
            лише в замовленні, без виклику API.
          </p>
        )}

        {isNovaPoshta && !senderReady && (
          <p className="text-xs text-destructive">
            У способу доставки «{selected.name}» не заповнено відправника — settings → Доставка → редагувати.
          </p>
        )}

        {isNovaPoshta && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Ім&apos;я отримувача (ПІБ)</FieldLabel>
                <Input
                  value={values.recipientName}
                  onChange={(e) => onChange({ recipientName: e.target.value })}
                  placeholder="Прізвище Ім'я По батькові"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Телефон отримувача</FieldLabel>
                <PhoneInput value={values.recipientPhone} onChange={(v) => onChange({ recipientPhone: v })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Місто</FieldLabel>
                <NpSearchCombobox
                  selectedLabel={values.recipientCity}
                  placeholder="Пошук міста..."
                  onSearch={(query) => searchDeliveryCitiesAction(selectedEntitySettings?.apiKey ?? "", query)}
                  onSelect={handleCityChange}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Відділення</FieldLabel>
                <NpSearchCombobox
                  selectedLabel={values.recipientWarehouse}
                  placeholder={values.recipientCityRef ? "Пошук відділення..." : "Спершу оберіть місто"}
                  disabled={!values.recipientCityRef}
                  onSearch={(query) =>
                    searchDeliveryWarehousesAction(selectedEntitySettings?.apiKey ?? "", values.recipientCityRef, query)
                  }
                  onSelect={(item) => onChange({ recipientWarehouseRef: item.ref, recipientWarehouse: item.name })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Вага, кг</FieldLabel>
                <DecimalInput value={values.weightKg} onChange={(v) => onChange({ weightKg: v })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Місць</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={values.seatsAmount}
                  onChange={(e) => onChange({ seatsAmount: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Оголошена вартість, грн</FieldLabel>
                <DecimalInput value={values.declaredValue} onChange={(v) => onChange({ declaredValue: v })} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Опис вантажу (у ЕН)</FieldLabel>
              <Input value={values.description} onChange={(e) => onChange({ description: e.target.value })} />
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={values.createShipmentNow}
                onCheckedChange={(checked) => onChange({ createShipmentNow: checked === true })}
                disabled={!senderReady}
              />
              Створити ЕН одразу (реальний виклик Нової пошти)
            </label>
          </>
        )}
      </CardContent>
    </Card>
  );
}
