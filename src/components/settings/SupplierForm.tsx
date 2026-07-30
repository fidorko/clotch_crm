"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, FileText, Globe, MapPin, Phone, Save, Send, type LucideIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { IconInput } from "@/components/settings/SupplierIconInput";
import { SupplierContactsFields } from "@/components/settings/SupplierContactsFields";
import { SupplierChannelFields } from "@/components/settings/SupplierChannelFields";
import { SupplierCustomFields } from "@/components/settings/SupplierCustomFields";
import { SupplierTypeLegend } from "@/components/settings/SupplierTypeLegend";
import { MESSENGER_CHANNELS, SOCIAL_CHANNELS, SUPPLIER_TYPE_OPTIONS } from "@/lib/constants/supplier-options";
import type { SupplierChannelInput, SupplierContactInput, SupplierCustomFieldInput } from "@/lib/types/supplier";
import type { SupplierDetail } from "@/server/data/suppliers";
import { createSupplierAction, updateSupplierAction } from "@/app/settings/references/suppliers/actions";

function channelsToValues(channels: SupplierChannelInput[], kind: "messenger" | "social"): Record<string, string> {
  const result: Record<string, string> = {};
  for (const c of channels) {
    if (c.kind === kind) result[c.channel] = c.value;
  }
  return result;
}

function valuesToChannels(
  messengerValues: Record<string, string>,
  socialValues: Record<string, string>
): SupplierChannelInput[] {
  const channels: SupplierChannelInput[] = [];
  for (const [channel, value] of Object.entries(messengerValues)) {
    if (value.trim()) channels.push({ kind: "messenger", channel, value });
  }
  for (const [channel, value] of Object.entries(socialValues)) {
    if (value.trim()) channels.push({ kind: "social", channel, value });
  }
  return channels;
}

const EMPTY_CONTACT: SupplierContactInput = { name: "", jobTitle: "", phone: "", email: "" };

// Іконка в кольоровому колі перед заголовком картки — той самий патерн, що
// плитки ReferencesList/легенда SupplierTypeLegend.
function SectionTitle({ icon: Icon, colorClass, children }: { icon: LucideIcon; colorClass: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`flex size-7 shrink-0 items-center justify-center rounded-md ${colorClass}`}>
        <Icon className="size-3.5" />
      </span>
      <h2 className="text-sm font-semibold text-foreground">{children}</h2>
    </div>
  );
}

export function SupplierForm({ detail }: { detail: SupplierDetail | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const supplier = detail?.supplier ?? null;

  const [name, setName] = useState(supplier?.name ?? "");
  const [type, setType] = useState<string>(supplier?.type ?? "other");
  const [isActive, setIsActive] = useState(supplier?.isActive ?? true);
  const [website, setWebsite] = useState(supplier?.website ?? "");
  const [country, setCountry] = useState(supplier?.country ?? "");
  const [city, setCity] = useState(supplier?.city ?? "");
  const [address, setAddress] = useState(supplier?.address ?? "");
  const [notes, setNotes] = useState(supplier?.notes ?? "");

  const [contacts, setContacts] = useState<SupplierContactInput[]>(
    detail?.contacts.length
      ? detail.contacts.map((c) => ({
          name: c.name,
          jobTitle: c.jobTitle ?? "",
          phone: c.phone ?? "",
          email: c.email ?? "",
        }))
      : [{ ...EMPTY_CONTACT }]
  );
  const [messengerValues, setMessengerValues] = useState<Record<string, string>>(
    channelsToValues(detail?.channels.map((c) => ({ kind: c.kind, channel: c.channel, value: c.value })) ?? [], "messenger")
  );
  const [socialValues, setSocialValues] = useState<Record<string, string>>(
    channelsToValues(detail?.channels.map((c) => ({ kind: c.kind, channel: c.channel, value: c.value })) ?? [], "social")
  );
  const [customFields, setCustomFields] = useState<SupplierCustomFieldInput[]>(
    detail?.customFields.map((f) => ({ label: f.label, value: f.value ?? "" })) ?? []
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input = {
      name,
      type,
      isActive,
      website,
      country,
      city,
      address,
      notes,
      contacts,
      channels: valuesToChannels(messengerValues, socialValues),
      customFields,
    };

    startTransition(async () => {
      try {
        if (supplier) {
          await updateSupplierAction(supplier.id, input);
          router.refresh();
        } else {
          const created = await createSupplierAction(input);
          router.push(`/settings/references/suppliers/${created.id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти постачальника");
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link href="/settings" className="hover:text-foreground">
              Налаштування
            </Link>
            <span>/</span>
            <Link href="/settings?tab=references" className="hover:text-foreground">
              Довідники
            </Link>
            <span>/</span>
            <Link href="/settings/references/suppliers" className="hover:text-foreground">
              Постачальники
            </Link>
            <span>/</span>
            <span className="text-foreground">{supplier ? supplier.name : "Додати постачальника"}</span>
          </nav>
          <HeaderActions />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold text-foreground">
              {supplier ? supplier.name : "Додати постачальника"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {supplier ? `Код: ${supplier.code}` : "Створіть нового постачальника та заповніть основну інформацію"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings/references/suppliers" className={buttonVariants({ variant: "outline" })}>
              Скасувати
            </Link>
            <Button type="submit" form="supplier-form" disabled={isPending}>
              <Save className="size-4" />
              {supplier ? "Зберегти" : "Зберегти постачальника"}
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <form id="supplier-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <Card className="gap-0 py-4">
            <CardContent className="flex flex-col gap-4 px-4">
              <SectionTitle icon={Building2} colorClass="bg-blue-500/15 text-blue-600 dark:text-blue-400">
                Основна інформація
              </SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-muted-foreground" htmlFor="supplier-name">
                    Назва компанії
                  </label>
                  <Input
                    id="supplier-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Назва постачальника"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-muted-foreground" htmlFor="supplier-code">
                    Код постачальника
                  </label>
                  <Input
                    id="supplier-code"
                    value={supplier?.code ?? "Згенерується автоматично"}
                    disabled
                    className="text-muted-foreground"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-muted-foreground">Тип постачальника</label>
                  <Select value={type} onValueChange={(v) => setType(v ?? "other")}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value: string) => SUPPLIER_TYPE_OPTIONS.find((o) => o.value === value)?.label}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPLIER_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-muted-foreground" htmlFor="supplier-website">
                    Веб-сайт
                  </label>
                  <IconInput
                    icon={Globe}
                    id="supplier-website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-foreground">Активний постачальник</span>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 py-4">
            <CardContent className="flex flex-col gap-4 px-4">
              <SectionTitle icon={Phone} colorClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                Контактна інформація
              </SectionTitle>
              <SupplierContactsFields contacts={contacts} onChange={setContacts} />

              <div className="flex items-center gap-2 border-t border-border pt-4">
                <MapPin className="size-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Адреса</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-muted-foreground" htmlFor="supplier-country">
                    Країна
                  </label>
                  <Input id="supplier-country" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-muted-foreground" htmlFor="supplier-city">
                    Місто
                  </label>
                  <Input id="supplier-city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-muted-foreground" htmlFor="supplier-address">
                    Адреса
                  </label>
                  <Input id="supplier-address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>
              <SupplierCustomFields fields={customFields} onChange={setCustomFields} />
            </CardContent>
          </Card>

          <Card className="gap-0 py-4">
            <CardContent className="flex flex-col gap-4 px-4">
              <SectionTitle icon={Send} colorClass="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                Месенджери та соціальні мережі
              </SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <SupplierChannelFields
                  title="Месенджери"
                  options={MESSENGER_CHANNELS}
                  values={messengerValues}
                  onChange={setMessengerValues}
                  inputType="tel"
                />
                <SupplierChannelFields
                  title="Соціальні мережі"
                  options={SOCIAL_CHANNELS}
                  values={socialValues}
                  onChange={setSocialValues}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 py-4">
            <CardContent className="flex flex-col gap-4 px-4">
              <SectionTitle icon={FileText} colorClass="bg-violet-500/15 text-violet-600 dark:text-violet-400">
                Додаткова інформація
              </SectionTitle>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground" htmlFor="supplier-notes">
                    Примітки
                  </label>
                  <span className="text-xs text-muted-foreground">{notes.length} / 500</span>
                </div>
                <Textarea
                  id="supplier-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                  placeholder="Довільні нотатки про постачальника..."
                  maxLength={500}
                  className="min-h-24"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <SupplierTypeLegend />
        </div>
      </form>
    </div>
  );
}
