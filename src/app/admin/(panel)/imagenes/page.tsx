import { ImagesTable } from "@/components/admin/ImagesTable";
import { adminData } from "@/lib/admin-data";

export default async function ImagesAdmin() {
  const { products } = await adminData();
  return <ImagesTable products={products} />;
}
