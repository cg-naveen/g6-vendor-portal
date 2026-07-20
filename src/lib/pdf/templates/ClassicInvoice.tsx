import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { InvoicePdfData } from "../types";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, borderBottom: "2 solid #1f2937", paddingBottom: 14 },
  logo: { width: 90, height: 90, objectFit: "contain", marginBottom: 6 },
  title: { fontSize: 22, fontWeight: 700, color: "#1f2937", letterSpacing: 1 },
  metaBox: { textAlign: "right" },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  label: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", marginBottom: 3, letterSpacing: 0.5 },
  value: { fontSize: 10, marginBottom: 2 },
  table: { borderTop: "1 solid #1f2937", borderBottom: "1 solid #1f2937", marginTop: 10 },
  tableHeader: { flexDirection: "row", backgroundColor: "#1f2937", paddingVertical: 6, paddingHorizontal: 6 },
  tableHeaderText: { color: "#ffffff", fontSize: 8, textTransform: "uppercase", fontWeight: 700 },
  tableRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 6, borderBottom: "0.5 solid #e5e7eb" },
  colDate: { width: "15%" },
  colDesc: { width: "45%" },
  colQty: { width: "12%", textAlign: "right" },
  colRate: { width: "14%", textAlign: "right" },
  colAmount: { width: "14%", textAlign: "right" },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  totalsBox: { width: 200 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTop: "1 solid #1f2937", marginTop: 4 },
  totalLabel: { fontSize: 11, fontWeight: 700 },
  totalValue: { fontSize: 11, fontWeight: 700 },
  notes: { marginTop: 24, fontSize: 9, color: "#4b5563" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#9ca3af", borderTop: "0.5 solid #e5e7eb", paddingTop: 8 },
  watermark: { position: "absolute", top: "42%", left: 0, right: 0, textAlign: "center", fontSize: 60, color: "#e5e7eb", opacity: 0.5, transform: "rotate(-30deg)" },
});

export function ClassicInvoice({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {data.watermarkText ? <Text style={styles.watermark}>{data.watermarkText}</Text> : null}

        <View style={styles.headerRow}>
          <View>
            {data.logoDataUri ? <Image src={data.logoDataUri} style={styles.logo} /> : null}
            <Text style={styles.title}>INVOICE</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.label}>Invoice Number</Text>
            <Text style={styles.value}>{data.invoiceNumber}</Text>
            <Text style={styles.label}>Issue Date</Text>
            <Text style={styles.value}>{data.issueDate}</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.label}>From</Text>
            <Text style={styles.value}>{data.vendorDisplayName}</Text>
            <Text style={styles.value}>{data.vendorAddress}</Text>
            <Text style={styles.value}>{data.vendorEmail}</Text>
            <Text style={styles.value}>{data.vendorPhone}</Text>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={styles.value}>{data.billToName}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDate]}>Date</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
          </View>
          {data.lineItems.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.colDate}>{item.date}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colRate}>{item.rate}</Text>
              <Text style={styles.colAmount}>{item.amount}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsRow}>
          <View style={styles.totalsBox}>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{data.total}</Text>
            </View>
          </View>
        </View>

        {data.notes ? (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{data.notes}</Text>
          </View>
        ) : null}

        {data.footerText ? (
          <Text style={styles.footer} fixed>
            {data.footerText}
          </Text>
        ) : null}
      </Page>
    </Document>
  );
}
