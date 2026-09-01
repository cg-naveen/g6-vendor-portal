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

const FIELD_NAMES: Record<
  AddressPrefix,
  {
    line1: string;
    line2: string;
    city: string;
    postcode: string;
    state: string;
    country: string;
  }
> = {
  home: {
    line1: "homeAddressLine1",
    line2: "homeAddressLine2",
    city: "homeCity",
    postcode: "homePostcode",
    state: "homeState",
    country: "homeCountry",
  },
  bank: {
    line1: "bankAddressLine1",
    line2: "bankAddressLine2",
    city: "bankCity",
    postcode: "bankPostcode",
    state: "bankState",
    country: "bankCountry",
  },
};

/**
 * Structured address fields for home or bank addresses on the Vendor model.
 * Field names are fixed maps (not string concatenation) so home/bank columns
 * cannot be crossed accidentally.
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
  const names = FIELD_NAMES[prefix];

  return (
    <div className="space-y-4">
      <FormField
        label="Address Line 1"
        name={names.line1}
        required={required}
        defaultValue={defaultValues?.line1 ?? ""}
        error={errors[names.line1]}
      />
      <FormField
        label="Address Line 2 (optional)"
        name={names.line2}
        defaultValue={defaultValues?.line2 ?? ""}
        error={errors[names.line2]}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="City"
          name={names.city}
          required={required}
          defaultValue={defaultValues?.city ?? ""}
          error={errors[names.city]}
        />
        <FormField
          label="Postcode"
          name={names.postcode}
          required={required}
          defaultValue={defaultValues?.postcode ?? ""}
          error={errors[names.postcode]}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="State"
          name={names.state}
          required={required}
          defaultValue={defaultValues?.state ?? ""}
          error={errors[names.state]}
        />
        <FormField
          label="Country"
          name={names.country}
          required={required}
          defaultValue={defaultValues?.country ?? ""}
          error={errors[names.country]}
        />
      </div>
    </div>
  );
}
