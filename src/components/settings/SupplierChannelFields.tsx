import { Input } from "@/components/ui/input";
import type { SupplierChannelOption } from "@/lib/constants/supplier-options";

// Фіксований набір рядків (не user-addable) — рівно ті месенджери/соцмережі, що
// в довіднику; фірмова іконка (react-icons/fa6) у кружечку брендового кольору.
export function SupplierChannelFields({
  title,
  options,
  values,
  onChange,
  inputType = "text",
}: {
  title: string;
  options: SupplierChannelOption[];
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  inputType?: "tel" | "text";
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">{title}</span>
      {options.map((option) => (
        <div key={option.value} className="flex items-center gap-2">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: option.color }}
          >
            <option.icon className="size-3.5" />
          </span>
          <Input
            value={values[option.value] ?? ""}
            onChange={(e) => onChange({ ...values, [option.value]: e.target.value })}
            placeholder={option.label}
            type={inputType}
            className="flex-1"
          />
        </div>
      ))}
    </div>
  );
}
