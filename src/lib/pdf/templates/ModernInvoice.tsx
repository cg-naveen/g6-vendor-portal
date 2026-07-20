import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { InvoicePdfData } from "../types";

const ACCENT = "#4f46e5";

const styles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: "Helvetica", color: "#111827" },
  banner: { backgroundColor: ACCENT, paddingHorizontal: 40, paddingVertical: 26, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: { width: 70, height: 70, objectFit: "contain", marginBottom: 6, backgroundColor: "#ffffff", borderRadius: 4 },
  title: { fontSize: 24, fontWeight: 700, color: "#ffffff", letterSpacing: 1 },
  bannerMeta: { textAlign: "right", color: "#e0e7ff" },
  bannerMetaValue: { color: "#ffffff", fontSize: 11, marginBottom: 6 },
  body: { padding: 40 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  card: { backgroundColor: "#f5f5ff", borderRadius: 6, padding: 12, width: "48%" },
  label: { fontSize: 8, color: ACCENT, textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5, fontWeight: 700 },
  value: { fontSize: 10, marginBottom: 2 },
  tableHeader: { flexDirection: "row", paddingVertical: 8, borderBottom: `1.5 solid ${ACCENT}` },
  tableHeaderText: { color: ACCENT, fontSize: 8, textTransform: "uppercase", fontWeight: 700 },
  tableRow: { flexDirection: "row", paddingVertical: 8, borderBottom: "0.5 solid #ececff" },
  colDate: { width: "15%" },
  colDesc: { width: "45%" },
  colQty: { width: "12%", textAlign: "right" },
  colRate: { width: "14%", textAlign: "right" },
  colAmount: { width: "14%", textAlign: "right" },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16 },
  totalsBox: { width: 200, backgroundColor: ACCENT, borderRadius: 6, padding: 12 },
  totalLine: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontSize: 11, fontWeight: 700, color: "#ffffff" },
  totalValue: { fontSize: 12, fontWeight: 700, color: "#ffffff" },
  notes: { marginTop: 24, fontSize: 9, color: "#4b5563" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#9ca3af" },
  watermark: { position: "absolute", top: "42%", left: 0, right: 0, textAlign: "center", fontSize: 60, color: ACCENT, opacity: 0.12, transform: "rotate(-30deg)" },
});

export function ModernInvoice({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {data.watermarkText ? <Text style={styles.watermark}>{data.watermarkText}</Text> : null}

        <View style={styles.banner}>
          <View>
            {data.logoDataUri ? <Image src={data.logoDataUri} style={styles.logo} /> : null}
            <Text style={styles.title}>Invoice</Text>
          </View>
          <View style={styles.bannerMeta}>
            <Text>{data.invoiceNumber}</Text>
            <Text style={styles.bannerMetaValue}>{data.issueDate}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.sectionRow}>
            <View style={styles.card}>
              <Text style={styles.label}>From</Text>
              <Text style={styles.value}>{data.vendorDisplayName}</Text>
              <Text style={styles.value}>{data.vendorAddress}</Text>
              <Text style={styles.value}>{data.vendorEmail}</Text>
              <Text style={styles.value}>{data.vendorPhone}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.label}>Bill To</Text>
              <Text style={styles.value}>{data.billToName}</Text>
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
