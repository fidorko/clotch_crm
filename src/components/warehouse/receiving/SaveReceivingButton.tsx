"use client";

import { useState } from "react";
import { Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

// Немає таблиці документів надходження в БД (warehouse-receiving.md) —
// реального збереження поки нема, кнопка лише візуально підтверджує клік
// (не блокує подальше редагування). Коли зʼявиться бекенд — сюди
// підключиться server action, що збере дані з ReceivingItemsTable/
// ReceivingInfoForm (стан зараз живе окремо в кожному з них).
export function SaveReceivingButton() {
  const [saved, setSaved] = useState(false);

  function handleClick() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <Button variant="outline" onClick={handleClick}>
      {saved ? <Check className="size-4" /> : <Save className="size-4" />}
      {saved ? "Збережено" : "Зберегти"}
    </Button>
  );
}
