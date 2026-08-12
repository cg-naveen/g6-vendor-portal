import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { vendorDisplayName } from "@/lib/invoice";
import { AdminEditVendorForm, type EditVendorFields } from "./AdminEditVendorForm";

export default async function EditVendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) notFound();

  const fields: EditVendorFields = {
    id: vendor.id,
    type: vendor.type,
    vendorEmail: vendor.vendorEmail,
    phone: vendor.phone,
    country: vendor.country,
    city: vendor.city,
    state: vendor.state,
    companyName: vendor.companyName,
    companyRegNumber: vendor.companyRegNumber,
    businessAddress: vendor.businessAddress,
    contactPersonName: vendor.contactPersonName,
    contactPersonEmail: vendor.contactPersonEmail,
    contactPersonPhone: vendor.contactPersonPhone,
    vendorName: vendor.vendorName,
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
  };

  return (
    <div>
      <div className="mb-6">
        <Link href={`/admin/vendors/${vendor.id}`} className="text-sm text-[#9d84ff] hover:text-[#cabfff]">
          ← Back to vendor
        </Link>
        <h1 className="g6-page-title mt-2">Edit Vendor — {vendorDisplayName(vendor)}</h1>
      </div>
      <AdminEditVendorForm vendor={fields} />
    </div>
  );
}
