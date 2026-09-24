"use client";

import type { ReactNode } from "react";

/**
 * Opens a payslip PDF without involving the App Router or PCB blur-submit.
 *
 * A plain same-origin `<a target="_blank">` next to the PCB input was racing
 * blur → setPayslipPcbAction → revalidatePath, which surfaced as a 500 on the
 * payroll page while the PDF tab still loaded. Mouse-down preventDefault keeps
 * focus on the input; window.open avoids any soft-navigation of this tab.
 */
export function PayslipPdfLink({
  payslipId,
  children,
}: {
  payslipId: string;
  children: ReactNode;
}) {
  const href = `/api/payslips/${payslipId}/pdf`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-payslip-pdf-link=""
      className="text-[#9d84ff] hover:text-[#cabfff]"
      onMouseDown={(event) => {
        // Stop the adjacent PCB input from blurring (and auto-submitting) first.
        event.preventDefault();
      }}
      onClick={(event) => {
        event.preventDefault();
        window.open(href, "_blank", "noopener,noreferrer");
      }}
    >
      {children}
    </a>
  );
}
