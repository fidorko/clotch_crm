"use client";

import { Plus, Repeat, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DeliveryMethodFormInput } from "@/app/settings/delivery/actions";
import type { OrderStatusRow } from "@/server/data/order-statuses";
import { NOVA_POSHTA_TRACKING_STATUSES } from "@/lib/constants/nova-poshta";

export interface StatusRuleDraft {
  key: string;
  carrierStatus: string;
  orderStatusId: string | null;
}

/** «Автоматичні дії» — DeliveryMethodFormDialog.tsx переріс ліміт, винесено окремим компонентом (CLAUDE.md, розділ 0/9.6). Лише конфігурація — сама перевірка/застосування правил не реалізована (settings-delivery.md). */
export function DeliveryMethodAutomationFields({
  form,
  setField,
  statusRules,
  onStatusRulesChange,
  orderStatuses,
}: {
  form: DeliveryMethodFormInput;
  setField: <K extends keyof DeliveryMethodFormInput>(field: K, value: DeliveryMethodFormInput[K]) => void;
  statusRules: StatusRuleDraft[];
  onStatusRulesChange: (rules: StatusRuleDraft[]) => void;
  orderStatuses: OrderStatusRow[];
}) {
  function addRule() {
    onStatusRulesChange([...statusRules, { key: crypto.randomUUID(), carrierStatus: "", orderStatusId: null }]);
  }

  function updateRule(key: string, patch: Partial<StatusRuleDraft>) {
    onStatusRulesChange(statusRules.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRule(key: string) {
    onStatusRulesChange(statusRules.filter((r) => r.key !== key));
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Repeat className="size-4 text-muted-foreground" />
        Автоматичні дії
      </h3>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground">Частота синхронізації, хв</label>
        <Input
          type="number"
          min={0}
          value={form.syncFrequencyMinutes}
          onChange={(e) => setField("syncFrequencyMinutes", e.target.value)}
          placeholder="Напр. 15"
          className="w-28"
        />
      </div>

      <label className="flex items-center justify-between gap-3 text-sm text-foreground">
        Оформлювати повернення через API при відмові отримувача на відділенні
        <Switch
          checked={form.orderReturnOnRefusal}
          onCheckedChange={(v) => setField("orderReturnOnRefusal", v)}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        Автоматики (фонового відстеження відмов) немає — вмикач лише дозволяє дію «Оформити повернення» під час обробки замовлення.
      </p>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">При статусі перевізника → змінити статус замовлення на</span>
        {statusRules.map((rule) => (
          <div key={rule.key} className="flex items-center gap-2">
            <Select
              value={rule.carrierStatus}
              onValueChange={(v) => updateRule(rule.key, { carrierStatus: v ?? "" })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue>
                  {(v: string) =>
                    NOVA_POSHTA_TRACKING_STATUSES.find((s) => s.code === v)?.label ?? "Оберіть статус перевізника"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {NOVA_POSHTA_TRACKING_STATUSES.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={rule.orderStatusId ?? ""}
              onValueChange={(v) => updateRule(rule.key, { orderStatusId: v || null })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue>
                  {(v: string) => orderStatuses.find((s) => s.id === v)?.name ?? "Оберіть статус"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {orderStatuses.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeRule(rule.key)}
              aria-label="Видалити правило"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addRule}>
          <Plus className="size-4" />
          Додати правило
        </Button>
      </div>
    </div>
  );
}
