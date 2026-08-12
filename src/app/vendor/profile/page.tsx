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
            homeAddressLine1: vendor.homeAddressLine1,
            homeAddressLine2: vendor.homeAddressLine2,
            homeCity: vendor.homeCity,
            homePostcode: vendor.homePostcode,
            homeState: vendor.homeState,
            homeCountry: vendor.homeCountry,
            bankName: vendor.bankName,
            accountNumber: vendor.accountNumber,
            accountHolderName: vendor.accountHolderName,
            ifsc: vendor.ifsc,
            swift: vendor.swift,
            bankAddressLine1: vendor.bankAddressLine1,
            bankAddressLine2: vendor.bankAddressLine2,
            bankCity: vendor.bankCity,
            bankPostcode: vendor.bankPostcode,
            bankState: vendor.bankState,
            bankCountry: vendor.bankCountry,
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
