import { requireVendor } from "@/lib/currentUser";
import { vendorDisplayName } from "@/lib/invoice";
import { changeVendorPassword } from "@/actions/profile";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";
import { VendorProfileForm } from "./VendorProfileForm";

export default async function VendorProfilePage() {
  const vendor = await requireVendor();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="g6-page-title">{vendorDisplayName(vendor)}</h1>
        <p className="g6-page-subtitle mt-1">{vendor.vendorEmail}</p>
      </div>

      <div className="g6-card p-6">
        <VendorProfileForm
          vendor={{
            type: vendor.type,
            phone: vendor.phone,
            country: vendor.country,
            city: vendor.city,
            state: vendor.state,
            businessAddress: vendor.businessAddress,
            contactPersonName: vendor.contactPersonName,
            contactPersonEmail: vendor.contactPersonEmail,
            contactPersonPhone: vendor.contactPersonPhone,
            homeAddress: vendor.homeAddress,
            bankName: vendor.bankName,
            accountNumber: vendor.accountNumber,
            ifsc: vendor.ifsc,
            swift: vendor.swift,
            bankAddress: vendor.bankAddress,
          }}
        />
      </div>

      <div className="g6-card p-6">
        <h2 className="g6-section-label mb-4">Change Password</h2>
        <PasswordChangeForm action={changeVendorPassword} />
      </div>
    </div>
  );
}
