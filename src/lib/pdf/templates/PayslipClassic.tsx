import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PayslipContributionRow, PayslipPdfData } from "../types";

const styles = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 64, paddingHorizontal: 44, fontSize: 9, fontFamily: "Helvetica", color: "#18181b" },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 54, height: 54, objectFit: "contain", marginBottom: 8 },
  employerName: { fontSize: 14, fontWeight: 700 },
  employerLine: { fontSize: 8, color: "#52525b", marginTop: 2 },
  headerRight: { textAlign: "right" },
  periodLabel: { fontSize: 10, fontWeight: 700 },
  issuedLabel: { fontSize: 8, color: "#52525b", marginTop: 2 },

  rule: { borderTop: "0.5 solid #d4d4d8", marginTop: 16, marginBottom: 16 },
  ruleDashed: { borderTop: "0.5 dashed #d4d4d8", marginTop: 14, marginBottom: 14 },

  employeeName: { fontSize: 12, fontWeight: 700 },
  designation: { fontSize: 9, color: "#71717a", marginTop: 2 },

  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 14 },
  gridCell: { width: "25%", marginBottom: 10 },
  gridLabel: { fontSize: 7, color: "#71717a", marginBottom: 2 },
  gridValue: { fontSize: 9 },

  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  sectionTitle: { fontSize: 11, fontWeight: 700 },
  colHeaders: { flexDirection: "row" },
  colHeader: { fontSize: 7, color: "#71717a", textAlign: "right" },

  amountRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  amountLabel: { flex: 1, fontSize: 9 },
  colUnits: { width: 60, fontSize: 9, textAlign: "right" },
  colRate: { width: 60, fontSize: 9, textAlign: "right" },
  colAmount: { width: 80, fontSize: 9, textAlign: "right" },

  pillRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  pill: { backgroundColor: "#f4f4f5", borderRadius: 18, paddingVertical: 8, paddingHorizontal: 22, alignItems: "center", minWidth: 110 },
  pillLabel: { fontSize: 7, fontWeight: 700, color: "#52525b" },
  pillValue: { fontSize: 13, fontWeight: 700, marginTop: 2 },

  contribHeaderRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 4 },
  contribLabelCell: { flex: 1 },
  contribCell: { width: 52, fontSize: 9, textAlign: "right" },
  contribCellHeader: { width: 52, fontSize: 7, color: "#71717a", textAlign: "right" },
  contribTotal: { width: 80, fontSize: 9, textAlign: "right" },
  contribRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  rowLabelStrong: { flex: 1, fontSize: 9, fontWeight: 700 },
  rowLabelMuted: { flex: 1, fontSize: 8, color: "#71717a" },
  cellMuted: { width: 52, fontSize: 8, color: "#71717a", textAlign: "right" },

  taxableRow: { alignItems: "flex-end", marginTop: 10 },
  taxableLabel: { fontSize: 7, fontWeight: 700, color: "#52525b" },
  taxableValue: { fontSize: 11, fontWeight: 700, color: "#52525b", marginTop: 1 },

  footnotes: { position: "absolute", bottom: 34, left: 44, right: 44 },
  footnote: { fontSize: 6.5, color: "#52525b", marginBottom: 3 },
  footer: { position: "absolute", bottom: 18, left: 44, right: 44, textAlign: "center", fontSize: 6.5, color: "#a1a1aa" },
});

/** Column headers above a Units / Rate / Amount block. */
function AmountColumnHeaders() {
  return (
    <View style={styles.colHeaders}>
      <Text style={[styles.colHeader, { width: 60 }]}>Units</Text>
      <Text style={[styles.colHeader, { width: 60 }]}>Rate</Text>
      <Text style={[styles.colHeader, { width: 80 }]}>Amount</Text>
    </View>
  );
}

function AmountRows({ rows, negative }: { rows: PayslipPdfData["earnings"]; negative?: boolean }) {
  return (
    <>
      {rows.map((row, index) => (
        <View style={styles.amountRow} key={index}>
          <Text style={styles.amountLabel}>{row.label}</Text>
          <Text style={styles.colUnits}>{row.units ?? ""}</Text>
          <Text style={styles.colRate}>{row.rate ?? ""}</Text>
          <Text style={styles.colAmount}>
            {negative ? "-" : ""}
            {row.amount}
          </Text>
        </View>
      ))}
    </>
  );
}

function ContributionRow({
  row,
  strong,
  showZakat,
  showHrdf,
}: {
  row: PayslipContributionRow;
  strong: boolean;
  showZakat: boolean;
  showHrdf: boolean;
}) {
  const cell = strong ? styles.contribCell : styles.cellMuted;
  return (
    <View style={styles.contribRow}>
      <Text style={strong ? styles.rowLabelStrong : styles.rowLabelMuted}>{row.label}</Text>
      <Text style={cell}>{row.epf}</Text>
      <Text style={cell}>{row.socso}</Text>
      <Text style={cell}>{row.eis}</Text>
      {showZakat ? <Text style={cell}>{row.zakat}</Text> : null}
      <Text style={cell}>{row.pcb}</Text>
      {showHrdf ? <Text style={cell}>{row.hrdf}</Text> : null}
      <Text style={styles.contribTotal}>{row.total ? `-${row.total}` : ""}</Text>
    </View>
  );
}

export function PayslipClassic({ data }: { data: PayslipPdfData }) {
  const contributions = data.showEmployerContributions
    ? data.contributions
    : data.contributions.filter((row) => row.label === "Employee");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            {data.logoDataUri ? <Image src={data.logoDataUri} style={styles.logo} /> : null}
            <Text style={[styles.employerName, { color: data.accentColor }]}>{data.employerName}</Text>
            {data.employerAddressLines.map((line, index) => (
              <Text style={styles.employerLine} key={index}>
                {line}
              </Text>
            ))}
            {data.businessRegNumber ? (
              <Text style={styles.employerLine}>Business registration number: {data.businessRegNumber}</Text>
            ) : null}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.periodLabel}>{data.periodLabel}</Text>
            <Text style={styles.issuedLabel}>{data.issuedOnLabel}</Text>
          </View>
        </View>

        <View style={styles.rule} />

        <Text style={styles.employeeName}>{data.employeeName}</Text>
        <Text style={styles.designation}>{data.designation}</Text>

        <View style={styles.grid}>
          {data.fields.map((field) => (
            <View style={styles.gridCell} key={field.label}>
              <Text style={styles.gridLabel}>{field.label}</Text>
              <Text style={styles.gridValue}>{field.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.rule} />

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Gross Earnings</Text>
          <AmountColumnHeaders />
        </View>
        <AmountRows rows={data.earnings} />
        {data.wageDeductions.length > 0 ? <AmountRows rows={data.wageDeductions} negative /> : null}

        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Gross pay</Text>
            <Text style={styles.pillValue}>{data.grossPay}</Text>
          </View>
        </View>

        <View style={{ marginTop: 22 }}>
          <View style={styles.contribHeaderRow}>
            <Text style={[styles.sectionTitle, styles.contribLabelCell]}>Contributions</Text>
            <Text style={styles.contribCellHeader}>EPF 1</Text>
            <Text style={styles.contribCellHeader}>SOCSO</Text>
            <Text style={styles.contribCellHeader}>EIS</Text>
            {data.showZakatColumn ? <Text style={styles.contribCellHeader}>Zakat</Text> : null}
            <Text style={styles.contribCellHeader}>PCB 2</Text>
            {data.showHrdfColumn ? <Text style={styles.contribCellHeader}>HRDF</Text> : null}
            <Text style={[styles.contribCellHeader, { width: 80 }]}>Amount</Text>
          </View>

          {contributions.map((row) => (
            <ContributionRow
              key={row.label}
              row={row}
              strong={row.label === "Employee"}
              showZakat={data.showZakatColumn}
              showHrdf={data.showHrdfColumn}
            />
          ))}
        </View>

        <View style={styles.ruleDashed} />

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Net Earnings</Text>
          <AmountColumnHeaders />
        </View>
        {data.netDeductions.length > 0 ? <AmountRows rows={data.netDeductions} negative /> : null}

        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Net pay</Text>
            <Text style={styles.pillValue}>{data.netPay}</Text>
          </View>
        </View>

        <View style={styles.taxableRow}>
          <Text style={styles.taxableLabel}>Taxable pay</Text>
          <Text style={styles.taxableValue}>{data.taxablePay}</Text>
        </View>

        <View style={styles.footnotes} fixed>
          {data.footnotes.map((note, index) => (
            <Text style={styles.footnote} key={index}>
              {index + 1} {note}
            </Text>
          ))}
        </View>

        {data.footerText ? (
          <Text style={styles.footer} fixed>
            {data.footerText}
          </Text>
        ) : null}
      </Page>
    </Document>
  );
}
