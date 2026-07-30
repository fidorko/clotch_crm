"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createProductAction } from "@/app/products/actions";

export function CreateProductButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const id = await createProductAction();
        router.push(`/products/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося створити товар");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={handleClick} disabled={isPending}>
        <Plus className="size-4" />
        Додати товар
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
