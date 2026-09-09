"use client";

export function DeleteInvoiceButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this invoice? This cannot be undone.")) e.preventDefault();
      }}
      className="inline"
    >
      <button type="submit" className="text-[#ff9494] hover:text-[#ffb3b3]">
        Delete
      </button>
    </form>
  );
}
