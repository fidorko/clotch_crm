import { Mail, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconInput } from "@/components/settings/SupplierIconInput";
import { PhoneInput } from "@/components/ui/phone-input";
import type { SupplierContactInput } from "@/lib/types/supplier";

const EMPTY_CONTACT: SupplierContactInput = { name: "", jobTitle: "", phone: "", email: "" };

export function SupplierContactsFields({
  contacts,
  onChange,
}: {
  contacts: SupplierContactInput[];
  onChange: (next: SupplierContactInput[]) => void;
}) {
  function update(index: number, patch: Partial<SupplierContactInput>) {
    onChange(contacts.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function remove(index: number) {
    onChange(contacts.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {contacts.map((contact, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Контактна особа {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Видалити контактну особу"
              onClick={() => remove(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          {/* grid-cols-2 однаково на всі 4 поля — щоб ширини рядків завжди збігались (не flex з кнопкою лише в першому рядку) */}
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={contact.name}
              onChange={(e) => update(index, { name: e.target.value })}
              placeholder="Ім'я та прізвище"
            />
            <Input
              value={contact.jobTitle}
              onChange={(e) => update(index, { jobTitle: e.target.value })}
              placeholder="Посада"
            />
            <PhoneInput
              value={contact.phone}
              onChange={(value) => update(index, { phone: value })}
            />
            <IconInput
              icon={Mail}
              value={contact.email}
              onChange={(e) => update(index, { email: e.target.value })}
              placeholder="Email"
              type="email"
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => onChange([...contacts, { ...EMPTY_CONTACT }])}
      >
        <Plus className="size-3.5" />
        Додати контактну особу
      </Button>
    </div>
  );
}
