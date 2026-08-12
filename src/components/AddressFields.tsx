import { FormField } from "@/components/FormField";

export type AddressPrefix = "home" | "bank";

export type AddressDefaultValues = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  postcode?: string | null;
  state?: string | null;
  country?: string | null;
};

/**
 * Renders the 6 fields (line 1, line 2, city, postcode, state, country) that back both
 * the home address and bank address structured fields on the Vendor model. `prefix`
 * must match the Prisma column prefix (`home` / `bank`) so field `name`s line up with
 * what the server actions read from FormData.
 */
export function AddressFields({
  prefix,
  required = true,
  defaultValues,
  errors = {},
}: {
  prefix: AddressPrefix;
  required?: boolean;
  defaultValues?: AddressDefaultValues;
  errors?: Record<string, string>;
}) {
  const name = (suffix: string) => `${prefix}${suffix}`;

  return (
    <div className="space-y-4">
      <FormField
        label="Address Line 1"
        name={name("AddressLine1")}
        required={required}
        defaultValue={defaultValues?.line1 ?? ""}
        error={errors[name("AddressLine1")]}
      />
      <FormField
        label="Address Line 2 (optional)"
        name={name("AddressLine2")}
        defaultValue={defaultValues?.line2 ?? ""}
        error={errors[name("AddressLine2")]}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="City"
          name={name("City")}
          required={required}
          defaultValue={defaultValues?.city ?? ""}
          error={errors[name("City")]}
        />
        <FormField
          label="Postcode"
          name={name("Postcode")}
          required={required}
          defaultValue={defaultValues?.postcode ?? ""}
          error={errors[name("Postcode")]}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="State"
          name={name("State")}
          required={required}
          defaultValue={defaultValues?.state ?? ""}
          error={errors[name("State")]}
        />
        <FormField
          label="Country"
          name={name("Country")}
          required={required}
          defaultValue={defaultValues?.country ?? ""}
          error={errors[name("Country")]}
        />
      </div>
    </div>
  );
}
