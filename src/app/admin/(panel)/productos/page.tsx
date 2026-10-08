import { ProductsTable } from "@/components/admin/ProductsTable";
import { adminData } from "@/lib/admin-data";

export default async function ProductsAdmin() {
  const { products, categories } = await adminData();
  return <ProductsTable products={products} categories={categories} />;
}
