import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { InvoicePdfData } from "../types";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#27272a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  logo: { width: 50, height: 50, objectFit: "contain", marginBottom: 6 },
  companyName: { fontSize: 12, fontWeight: 700, color: "#27272a" },
  title: { fontSize: 22, fontWeight: 700, letterSpacing: 1, color: "#3f3f46", textAlign: "right" },

  metaTable: { marginTop: 10, alignSelf: "flex-end", border: "0.5 solid #a1a1aa" },
  metaRow: { flexDirection: "row" },
  metaCell: { paddingVertical: 4, paddingHorizontal: 8, borderRight: "0.5 solid #a1a1aa", borderBottom: "0.5 solid #a1a1aa", width: 90 },
  metaCellLast: { paddingVertical: 4, paddingHorizontal: 8, borderBottom: "0.5 solid #a1a1aa", width: 90 },
  metaHeadText: { fontSize: 7, color: "#52525b", textTransform: "uppercase", fontWeight: 700 },
  metaValueText: { fontSize: 9, marginTop: 2 },

  billToBox: { backgroundColor: "#f4f4f5", paddingVertical: 5, paddingHorizontal: 8, marginTop: 30, marginBottom: 6, alignSelf: "flex-start" },
  billToLabel: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#3f3f46" },

  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, marginBottom: 28 },
  label: { fontSize: 8, color: "#a1a1aa", textTransform: "uppercase", marginBottom: 4, letterSpacing: 1 },
  value: { fontSize: 10, marginBottom: 2 },

  tableHeader: { flexDirection: "row", backgroundColor: "#f4f4f5", paddingVertical: 6, paddingHorizontal: 6 },
  tableHeaderText: { color: "#3f3f46", fontSize: 8, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 },
  tableRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 6, borderBottom: "0.5 solid #f4f4f5" },
  colDate: { width: "15%" },
  colDesc: { width: "45%" },
  colQty: { width: "12%", textAlign: "right" },
  colRate: { width: "14%", textAlign: "right" },
  colAmount: { width: "14%", textAlign: "right" },

  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", width: 180, paddingTop: 10, borderTop: "0.5 solid #18181b" },
  totalLabel: { fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  totalValue: { fontSize: 12, fontWeight: 700 },

  paymentSection: { marginTop: 28 },
  paymentBox: { backgroundColor: "#f4f4f5", padding: 10, marginTop: 6 },
  paymentLine: { fontSize: 9, color: "#3f3f46", marginBottom: 2 },

  notes: { marginTop: 20, fontSize: 9, color: "#71717a" },

  signBox: { marginTop: 24, alignItems: "flex-end" },
  signImage: { width: 140, height: 50, objectFit: "contain", marginBottom: 4 },
  signLine: { width: 160, borderTop: "0.5 solid #a1a1aa", paddingTop: 4, textAlign: "center" },
  signText: { fontSize: 8, color: "#a1a1aa" },

  thankYou: { marginTop: 36, textAlign: "center", fontSize: 10, color: "#3f3f46" },
  footer: { position: "absolute", bottom: 36, left: 48, right: 48, textAlign: "center", fontSize: 8, color: "#a1a1aa" },
  watermark: { position: "absolute", top: "45%", left: 0, right: 0, textAlign: "center", fontSize: 48, color: "#f4f4f5", opacity: 0.8, transform: "rotate(-30deg)" },
});

export function MinimalInvoice({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {data.watermarkText ? <Text style={styles.watermark}>{data.watermarkText}</Text> : null}

        <View style={styles.header}>
          <View>
            {data.logoDataUri ? <Image src={data.logoDataUri} style={styles.logo} /> : null}
            <Text style={styles.companyName}>{data.vendorDisplayName}</Text>
            <Text style={{ fontSize: 8, color: "#71717a", marginTop: 2 }}>{data.vendorAddress}</Text>
          </View>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <View style={styles.metaTable}>
              <View style={styles.metaRow}>
                <View style={styles.metaCell}>
                  <Text style={styles.metaHeadText}>Invoice #</Text>
                  <Text style={styles.metaValueText}>{data.invoiceNumber}</Text>
                </View>
                <View style={styles.metaCellLast}>
                  <Text style={styles.metaHeadText}>Issue Date</Text>
                  <Text style={styles.metaValueText}>{data.issueDate}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <View style={[styles.metaCell, { borderBottom: "none" }]}>
                  <Text style={styles.metaHeadText}>Due Date</Text>
                  <Text style={styles.metaValueText}>{data.dueDate}</Text>
                </View>
                <View style={[styles.metaCellLast, { borderBottom: "none" }]}>
                  <Text style={styles.metaHeadText}>Balance Due</Text>
                  <Text style={styles.metaValueText}>{data.total}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.billToBox}>
          <Text style={styles.billToLabel}>Bill To</Text>
        </View>
        <View style={styles.sectionRow}>
          <View style={{ width: "58%" }}>
            <Text style={styles.value}>{data.billToName}</Text>
            {data.billToAddress ? <Text style={styles.value}>{data.billToAddress}</Text> : null}
            {data.billToEmail ? <Text style={styles.value}>{data.billToEmail}</Text> : null}
          </View>
          <View style={{ width: "38%", textAlign: "right" }}>
            <Text style={styles.label}>Contact</Text>
            <Text style={styles.value}>{data.vendorEmail}</Text>
            <Text style={styles.value}>{data.vendorPhone}</Text>
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

        <View style={styles.paymentSection}>
          <Text style={styles.label}>Payment Details</Text>
          <View style={styles.paymentBox}>
            <Text style={styles.paymentLine}>Bank Name: {data.payment.bankName}</Text>
            <Text style={styles.paymentLine}>Account Holder Name: {data.payment.accountHolderName}</Text>
            <Text style={styles.paymentLine}>Account Number: {data.payment.accountNumber}</Text>
            {data.payment.ifsc ? <Text style={styles.paymentLine}>IFSC: {data.payment.ifsc}</Text> : null}
            <Text style={styles.paymentLine}>SWIFT: {data.payment.swift}</Text>
          </View>
        </View>

        {data.notes ? (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{data.notes}</Text>
          </View>
        ) : null}

        <View style={styles.signBox}>
          {data.signatureDataUri ? <Image src={data.signatureDataUri} style={styles.signImage} /> : null}
          <View style={styles.signLine}>
            <Text style={styles.signText}>Authorized Signature</Text>
          </View>
        </View>

        <Text style={styles.thankYou}>Thank you for your business!</Text>

        {data.footerText ? (
          <Text style={styles.footer} fixed>
            {data.footerText}
          </Text>
        ) : null}
      </Page>
    </Document>
  );
}
