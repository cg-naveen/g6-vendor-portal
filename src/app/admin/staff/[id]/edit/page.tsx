import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { EditStaffForm, type EditStaffFields } from "./EditStaffForm";

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) notFound();

  const fields: EditStaffFields = {
    id: employee.id,
    fullName: employee.fullName,
    designation: employee.designation,
    department: employee.department,
    nationality: employee.nationality,
    gender: employee.gender,
    nricOrPassport: employee.nricOrPassport,
    epfNumber: employee.epfNumber,
    socsoNumber: employee.socsoNumber,
    pcbNumber: employee.pcbNumber,
    email: employee.email,
    phone: employee.phone,
    addressLine1: employee.addressLine1,
    addressLine2: employee.addressLine2,
    city: employee.city,
    postcode: employee.postcode,
    state: employee.state,
    country: employee.country,
    bankName: employee.bankName,
    accountNumber: employee.accountNumber,
    accountHolderName: employee.accountHolderName,
    hiredOn: employee.hiredOn.toISOString().slice(0, 10),
    epfEnabled: employee.epfEnabled,
    socsoEnabled: employee.socsoEnabled,
    eisEnabled: employee.eisEnabled,
    epfEmployeeRateOverride: employee.epfEmployeeRateOverride?.toString() ?? null,
    epfEmployerRateOverride: employee.epfEmployerRateOverride?.toString() ?? null,
    monthlyZakat: employee.monthlyZakat?.toString() ?? null,
    taxResident: employee.taxResident,
    taxWorkerCategory: employee.taxWorkerCategory,
    taxMaritalStatus: employee.taxMaritalStatus,
    taxDependents: employee.taxDependents,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/admin/staff/${employee.id}`} className="text-sm text-[#9d84ff] hover:text-[#cabfff]">
        ← Back to staff profile
      </Link>
      <h1 className="g6-page-title mb-6 mt-2">Edit Staff — {employee.fullName}</h1>
      <EditStaffForm employee={fields} />
    </div>
  );
}
