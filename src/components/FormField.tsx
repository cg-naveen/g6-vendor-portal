type FormFieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  defaultValue?: string;
  placeholder?: string;
  as?: "input" | "textarea";
  step?: string;
  min?: string;
};

export function FormField({ label, name, type = "text", required, error, defaultValue, placeholder, as = "input", step, min }: FormFieldProps) {
  const baseClass =
    "w-full rounded-md border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 " +
    (error ? "border-red-400" : "border-zinc-300");

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {as === "textarea" ? (
        <textarea name={name} required={required} defaultValue={defaultValue} placeholder={placeholder} rows={3} className={baseClass} />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          step={type === "number" ? step ?? "0.01" : undefined}
          min={min}
          className={baseClass}
        />
      )}
      {error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : null}
    </label>
  );
}
