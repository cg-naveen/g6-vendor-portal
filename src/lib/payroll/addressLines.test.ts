import { describe, expect, it } from "vitest";
import { splitEmployerAddress } from "./addressLines";

describe("splitEmployerAddress", () => {
  it("returns empty for blank input", () => {
    expect(splitEmployerAddress(null)).toEqual([]);
    expect(splitEmployerAddress("   ")).toEqual([]);
  });

  it("preserves explicit newlines", () => {
    expect(
      splitEmployerAddress("E-05-02, Second Floor\nJalan USJ 25/1C\nSelangor, Malaysia")
    ).toEqual(["E-05-02, Second Floor", "Jalan USJ 25/1C", "Selangor, Malaysia"]);
  });

  it("wraps a long comma-separated address onto multiple rows", () => {
    const lines = splitEmployerAddress(
      "E-05-02, Second Floor, Garden Shoppe @ One City, Jalan USJ 25/1C, Subang Jaya, 47650, Selangor, Malaysia, Attention: Naveen Krishenan"
    );
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((line) => line.length <= 42 || !line.includes(", "))).toBe(true);
    expect(lines.join(", ")).toContain("Garden Shoppe @ One City");
    expect(lines.at(-1)).toBe("Attention: Naveen Krishenan");
  });

  it("leaves a short single-part address alone", () => {
    expect(splitEmployerAddress("Kuala Lumpur")).toEqual(["Kuala Lumpur"]);
  });
});
