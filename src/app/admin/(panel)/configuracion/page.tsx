import { SettingsForm } from "@/components/admin/SettingsForm";
import { adminData } from "@/lib/admin-data";

export default async function SettingsAdmin() {
  const { settings } = await adminData();
  return <SettingsForm settings={settings} />;
}
