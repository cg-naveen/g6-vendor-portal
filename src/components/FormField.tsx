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
  const baseClass = `g6-input ${error ? "g6-input-error" : ""}`;

  return (
    <label className="block">
      <span className="g6-label">
        {label}
        {required ? <span className="text-[#ff9494]"> *</span> : null}
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
      {error ? <span className="g6-help-error">{error}</span> : null}
    </label>
  );
}
