import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { adminData } from "@/lib/admin-data";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { products, categories } = await adminData();
  const p = products.find((x) => x.id === id);
  if (!p) notFound();
  return <ProductForm key={p.id} product={p} categories={categories} />;
}
