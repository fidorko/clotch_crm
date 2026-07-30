import type { Metadata } from "next";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { ReferencesList } from "@/components/settings/ReferencesList";
import { Tabs, TabsContent } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Налаштування",
};

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SettingsHeader />
      <Tabs defaultValue="references" className="flex flex-1 flex-col">
        <SettingsTabs />

        <TabsContent value="references" className="flex flex-col gap-4 p-6">
          <ReferencesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
