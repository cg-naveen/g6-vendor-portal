import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import type { InvoiceTemplate } from "@prisma/client";
import type { InvoicePdfData } from "./types";
import { ClassicInvoice } from "./templates/ClassicInvoice";
import { ModernInvoice } from "./templates/ModernInvoice";
import { MinimalInvoice } from "./templates/MinimalInvoice";

export async function renderInvoicePdf(template: InvoiceTemplate, data: InvoicePdfData): Promise<Buffer> {
  const doc =
    template === "MODERN" ? <ModernInvoice data={data} /> : template === "MINIMAL" ? <MinimalInvoice data={data} /> : <ClassicInvoice data={data} />;

  return renderToBuffer(doc);
}
