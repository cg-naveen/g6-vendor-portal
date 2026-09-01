"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_VENDOR_EXPORT_COLUMNS,
  downloadVendorExportCsv,
  VENDOR_EXPORT_COLUMNS,
  type VendorExportColumnId,
  type VendorExportPayload,
} from "@/lib/vendorExport";

export function VendorExportButton({ payload, fileName }: { payload: VendorExportPayload; fileName: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<VendorExportColumnId[]>(DEFAULT_VENDOR_EXPORT_COLUMNS);

  const groups = useMemo(() => {
    const map = new Map<string, typeof VENDOR_EXPORT_COLUMNS>();
    for (const column of VENDOR_EXPORT_COLUMNS) {
      const list = map.get(column.group) ?? [];
      list.push(column);
      map.set(column.group, list);
    }
    return Array.from(map.entries());
  }, []);

  function toggleColumn(id: VendorExportColumnId) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function selectAll() {
    setSelected(VENDOR_EXPORT_COLUMNS.map((column) => column.id));
  }

  function handleExport() {
    if (selected.length === 0) return;
    downloadVendorExportCsv(payload, selected, fileName);
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="g6-btn g6-btn-secondary g6-btn-sm">
        Export to Excel
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-[#2a2540] bg-[#100e18] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2540] px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[#f4f1ff]">Export Vendor Data</h2>
                <p className="mt-1 text-sm text-[#8781a0]">Choose the columns to include in the spreadsheet.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-[#8781a0] hover:text-[#f4f1ff]">
                Close
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto px-6 py-4">
              <div className="mb-4 flex gap-3">
                <button type="button" onClick={selectAll} className="text-sm text-[#9d84ff] hover:text-[#cabfff]">
                  Select all
                </button>
                <button type="button" onClick={() => setSelected([])} className="text-sm text-[#8781a0] hover:text-[#dcd8ea]">
                  Clear all
                </button>
              </div>

              <div className="space-y-6">
                {groups.map(([group, columns]) => (
                  <section key={group}>
                    <h3 className="g6-section-label mb-3">{group}</h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {columns.map((column) => (
                        <label key={column.id} className="flex items-center gap-2.5 rounded-lg border border-[#2a2540] px-3 py-2 text-sm text-[#dcd8ea]">
                          <input
                            type="checkbox"
                            checked={selected.includes(column.id)}
                            onChange={() => toggleColumn(column.id)}
                            className="h-4 w-4 accent-[#7c5cff]"
                          />
                          <span>{column.label}</span>
                        </label>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#2a2540] px-6 py-4">
              <button type="button" onClick={() => setOpen(false)} className="g6-btn g6-btn-ghost">
                Cancel
              </button>
              <button type="button" onClick={handleExport} disabled={selected.length === 0} className="g6-btn g6-btn-primary">
                Download CSV
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
