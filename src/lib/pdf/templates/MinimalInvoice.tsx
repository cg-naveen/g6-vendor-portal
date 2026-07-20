import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { InvoicePdfData } from "../types";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#18181b" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 },
  logo: { width: 60, height: 60, objectFit: "contain" },
  title: { fontSize: 16, fontWeight: 300, letterSpacing: 4, textTransform: "uppercase", color: "#18181b" },
  metaBox: { textAlign: "right" },
  metaText: { fontSize: 9, color: "#71717a", marginBottom: 2 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  label: { fontSize: 8, color: "#a1a1aa", textTransform: "uppercase", marginBottom: 4, letterSpacing: 1 },
  value: { fontSize: 10, marginBottom: 2 },
  tableHeader: { flexDirection: "row", paddingBottom: 6, borderBottom: "0.5 solid #d4d4d8" },
  tableHeaderText: { color: "#71717a", fontSize: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingVertical: 8, borderBottom: "0.5 solid #f4f4f5" },
  colDate: { width: "15%" },
  colDesc: { width: "45%" },
  colQty: { width: "12%", textAlign: "right" },
  colRate: { width: "14%", textAlign: "right" },
  colAmount: { width: "14%", textAlign: "right" },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", width: 180, paddingTop: 10, borderTop: "0.5 solid #18181b" },
  totalLabel: { fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  totalValue: { fontSize: 12, fontWeight: 700 },
  notes: { marginTop: 32, fontSize: 9, color: "#71717a" },
  footer: { position: "absolute", bottom: 36, left: 48, right: 48, textAlign: "center", fontSize: 8, color: "#a1a1aa" },
  watermark: { position: "absolute", top: "45%", left: 0, right: 0, textAlign: "center", fontSize: 48, color: "#f4f4f5", opacity: 0.8, transform: "rotate(-30deg)" },
});

export function MinimalInvoice({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {data.watermarkText ? <Text style={styles.watermark}>{data.watermarkText}</Text> : null}

        <View style={styles.header}>
          {data.logoDataUri ? <Image src={data.logoDataUri} style={styles.logo} /> : <Text style={styles.title}>Invoice</Text>}
          <View style={styles.metaBox}>
            <Text style={styles.metaText}>{data.invoiceNumber}</Text>
            <Text style={styles.metaText}>{data.issueDate}</Text>
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
            {data.billToAddress ? <Text style={styles.value}>{data.billToAddress}</Text> : null}
          </View>
        </View>

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

        <View style={styles.totalsRow}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{data.total}</Text>
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
