import { AvailabilityTable } from "@/components/admin/AvailabilityTable";
import { adminData } from "@/lib/admin-data";

export default async function AvailabilityAdmin() {
  const { products } = await adminData();
  return <AvailabilityTable products={products} />;
}
