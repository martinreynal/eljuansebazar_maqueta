import { CategoriesEditor } from "@/components/admin/CategoriesEditor";
import { adminData } from "@/lib/admin-data";

export default async function CategoriesAdmin() {
  const { categories, products } = await adminData();
  const counts: Record<string, number> = {};
  for (const c of categories) counts[c.id] = products.filter((p) => !p.archived && (c.is_offers ? p.tag === "oferta" : p.category_id === c.id)).length;
  return <CategoriesEditor key={categories.map((c) => c.id + c.position + c.name + c.active + c.image_path).join()} categories={categories} counts={counts} />;
}
