import { ProductForm } from "@/components/admin/ProductForm";
import { adminData } from "@/lib/admin-data";

export default async function NewProduct() {
  const { categories } = await adminData();
  return <ProductForm product={null} categories={categories} />;
}
