import { NewProductsReview } from "@/components/admin/NewProductsReview";
import { adminData } from "@/lib/admin-data";

export default async function NewProductsAdmin() {
  const { products, categories } = await adminData();
  const pending = products.filter((p) => p.staged && !p.archived).sort((a, b) => a.sku.localeCompare(b.sku, "es", { numeric: true }));
  return <NewProductsReview key={pending.map((p) => p.id).join()} products={pending} categories={categories} />;
}
