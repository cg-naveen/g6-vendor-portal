import { AddVendorForm } from "./AddVendorForm";

export default function NewVendorPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="g6-page-title mb-1">Add Vendor</h1>
      <p className="g6-page-subtitle mb-6">Manually create a vendor, freelancer, or contract employee account.</p>
      <div className="g6-card p-6">
        <AddVendorForm />
      </div>
    </div>
  );
}
