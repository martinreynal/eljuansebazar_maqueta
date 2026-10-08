import { DesignEditor } from "@/components/admin/DesignEditor";
import { adminData } from "@/lib/admin-data";

export default async function DesignAdmin() {
  const { settings, faqs, works, products } = await adminData();
  return <DesignEditor design={settings.design} faqs={faqs} works={works} products={products} />;
}
