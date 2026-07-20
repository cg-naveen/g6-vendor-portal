import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { InvoicePdfData } from "../types";

const NAVY = "#0f172a";
const ACCENT = "#d4a017";

const styles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },
  topBar: { height: 10, backgroundColor: NAVY },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 40, paddingTop: 26 },
  title: { fontSize: 32, fontWeight: 800, color: NAVY, letterSpacing: 1 },
  logo: { width: 56, height: 56, objectFit: "contain" },
  metaBox: { textAlign: "right" },
  metaLabel: { fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  metaValue: { fontSize: 10, fontWeight: 700, marginBottom: 8 },

  body: { padding: 40, paddingTop: 24 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  label: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, color: NAVY },
  value: { fontSize: 10, marginBottom: 2 },

  sectionHeading: { fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 10, marginTop: 6 },

  tableHeader: { flexDirection: "row", backgroundColor: ACCENT, paddingVertical: 7, paddingHorizontal: 8 },
  tableHeaderText: { color: "#1e293b", fontSize: 8, textTransform: "uppercase", fontWeight: 700 },
  tableRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderBottom: "0.5 solid #e2e8f0" },
  colDate: { width: "16%" },
  colDesc: { width: "40%" },
  colQty: { width: "12%", textAlign: "right" },
  colRate: { width: "16%", textAlign: "right" },
  colAmount: { width: "16%", textAlign: "right" },

  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  totalsBox: { width: 220 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  grandTotalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTop: `1.5 solid ${NAVY}`, marginTop: 4 },
  totalLabel: { fontSize: 10, color: "#475569" },
  grandTotalLabel: { fontSize: 11, fontWeight: 700, color: NAVY },
  grandTotalValue: { fontSize: 13, fontWeight: 700, color: NAVY },

  terms: { marginTop: 22 },
  termsItem: { fontSize: 9, color: "#475569", marginBottom: 3 },

  notes: { marginTop: 16, fontSize: 9, color: "#475569" },

  paymentBar: { backgroundColor: NAVY, paddingHorizontal: 40, paddingVertical: 18, flexDirection: "row", justifyContent: "space-between", marginTop: 28 },
  paymentCol: { flex: 1 },
  paymentHeading: { fontSize: 10, fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  paymentLine: { fontSize: 9, color: "#cbd5e1", marginBottom: 3 },
  paymentLineStrong: { fontSize: 9, color: "#ffffff", fontWeight: 700, marginBottom: 3 },

  footerBottomBar: { height: 8, backgroundColor: NAVY },

  watermark: { position: "absolute", top: "45%", left: 0, right: 0, textAlign: "center", fontSize: 60, color: NAVY, opacity: 0.08, transform: "rotate(-30deg)" },
});

export function ModernInvoice({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {data.watermarkText ? <Text style={styles.watermark}>{data.watermarkText}</Text> : null}

        <View style={styles.topBar} fixed />

        <View style={styles.headerRow}>
          <Text style={styles.title}>INVOICE</Text>
          <View style={styles.metaBox}>
            {data.logoDataUri ? <Image src={data.logoDataUri} style={[styles.logo, { marginLeft: "auto", marginBottom: 8 }]} /> : null}
            <Text style={styles.metaLabel}>Invoice Number</Text>
            <Text style={styles.metaValue}>{data.invoiceNumber}</Text>
            <Text style={styles.metaLabel}>Issue Date</Text>
            <Text style={styles.metaValue}>{data.issueDate}</Text>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>{data.dueDate}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.sectionRow}>
            <View style={{ width: "48%" }}>
              <Text style={styles.label}>Biller Info</Text>
              <Text style={styles.value}>{data.vendorDisplayName}</Text>
              <Text style={styles.value}>{data.vendorAddress}</Text>
              <Text style={styles.value}>{data.vendorEmail}</Text>
              <Text style={styles.value}>{data.vendorPhone}</Text>
            </View>
            <View style={{ width: "48%", textAlign: "right" }}>
              <Text style={styles.label}>Bill To</Text>
              <Text style={styles.value}>{data.billToName}</Text>
              {data.billToAddress ? <Text style={styles.value}>{data.billToAddress}</Text> : null}
            </View>
          </View>

          <Text style={styles.sectionHeading}>Service Details</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDate]}>Date</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Total</Text>
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

          <View style={styles.totalsWrap}>
            <View style={styles.totalsBox}>
              <View style={styles.grandTotalLine}>
                <Text style={styles.grandTotalLabel}>Total Amount Due</Text>
                <Text style={styles.grandTotalValue}>{data.total}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Terms and Conditions</Text>
          <View style={styles.terms}>
            <Text style={styles.termsItem}>• Payment is due by {data.dueDate}.</Text>
            <Text style={styles.termsItem}>• Late payments may incur additional charges.</Text>
            <Text style={styles.termsItem}>• Please make payment to the bank details below.</Text>
          </View>

          {data.notes ? (
            <View style={styles.notes}>
              <Text style={styles.label}>Notes</Text>
              <Text>{data.notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.paymentBar}>
          <View style={styles.paymentCol}>
            <Text style={styles.paymentHeading}>Payment Information</Text>
            <Text style={styles.paymentLine}>Bank Name: {data.payment.bankName}</Text>
            <Text style={styles.paymentLine}>Account Number: {data.payment.accountNumber}</Text>
            {data.payment.ifsc ? <Text style={styles.paymentLine}>IFSC: {data.payment.ifsc}</Text> : null}
            <Text style={styles.paymentLine}>SWIFT: {data.payment.swift}</Text>
            <Text style={styles.paymentLine}>Bank Address: {data.payment.bankAddress}</Text>
          </View>
          <View style={[styles.paymentCol, { alignItems: "flex-end" }]}>
            <Text style={styles.paymentLineStrong}>Due Date: {data.dueDate}</Text>
            {data.footerText ? <Text style={[styles.paymentLine, { textAlign: "right" }]}>{data.footerText}</Text> : null}
          </View>
        </View>
        <View style={styles.footerBottomBar} fixed />
      </Page>
    </Document>
  );
}
