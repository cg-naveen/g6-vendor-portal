import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { InvoicePdfData } from "../types";

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: "Helvetica", color: "#18181b" },
  body: { padding: 40 },

  headerBar: { backgroundColor: "#18181b", paddingHorizontal: 40, paddingVertical: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 60, height: 60, objectFit: "contain", marginBottom: 6 },
  title: { fontSize: 26, fontWeight: 700, color: "#ffffff", letterSpacing: 2 },
  invNoBox: { backgroundColor: "#000000", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 2 },
  invNoLabel: { fontSize: 8, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  invNoValue: { fontSize: 11, color: "#ffffff", fontWeight: 700 },

  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, marginBottom: 20 },
  label: { fontSize: 8, color: "#71717a", textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.8, fontWeight: 700 },
  value: { fontSize: 10, marginBottom: 2 },

  metaGrid: { flexDirection: "row", gap: 24, marginBottom: 22 },
  metaCell: { minWidth: 90 },

  table: { marginTop: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#18181b", paddingVertical: 7, paddingHorizontal: 8 },
  tableHeaderText: { color: "#ffffff", fontSize: 8, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderBottom: "0.5 solid #e4e4e7" },
  colDate: { width: "16%" },
  colDesc: { width: "40%" },
  colQty: { width: "12%", textAlign: "right" },
  colRate: { width: "16%", textAlign: "right" },
  colAmount: { width: "16%", textAlign: "right" },

  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalsBox: { width: 220 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 10, backgroundColor: "#18181b", marginTop: 6 },
  totalLabel: { fontSize: 11, fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: 0.5 },
  totalValue: { fontSize: 12, fontWeight: 700, color: "#ffffff" },

  twoCol: { flexDirection: "row", gap: 28, marginTop: 26 },
  colHalf: { flex: 1 },
  paymentBox: { border: "1 solid #e4e4e7", padding: 12, borderRadius: 2 },
  paymentLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  paymentLabel: { fontSize: 8, color: "#71717a" },
  paymentValue: { fontSize: 9, fontWeight: 700 },

  notes: { marginTop: 20, fontSize: 9, color: "#52525b" },

  footerBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#18181b", paddingVertical: 14, paddingHorizontal: 40, textAlign: "center" },
  footerText: { fontSize: 8, color: "#d4d4d8" },

  watermark: { position: "absolute", top: "45%", left: 0, right: 0, textAlign: "center", fontSize: 60, color: "#e4e4e7", opacity: 0.6, transform: "rotate(-30deg)" },
});

export function ClassicInvoice({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {data.watermarkText ? <Text style={styles.watermark}>{data.watermarkText}</Text> : null}

        <View style={styles.headerBar}>
          <View>
            {data.logoDataUri ? <Image src={data.logoDataUri} style={styles.logo} /> : null}
            <Text style={styles.title}>INVOICE</Text>
          </View>
          <View style={styles.invNoBox}>
            <Text style={styles.invNoLabel}>Invoice #</Text>
            <Text style={styles.invNoValue}>{data.invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text style={styles.label}>Issue Date</Text>
              <Text style={styles.value}>{data.issueDate}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.label}>Due Date</Text>
              <Text style={styles.value}>{data.dueDate}</Text>
            </View>
          </View>

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
                <Text style={styles.totalLabel}>Total Due</Text>
                <Text style={styles.totalValue}>{data.total}</Text>
              </View>
            </View>
          </View>

          <View style={styles.twoCol}>
            <View style={styles.colHalf}>
              <Text style={styles.label}>Payment Details</Text>
              <View style={styles.paymentBox}>
                <View style={styles.paymentLine}>
                  <Text style={styles.paymentLabel}>Bank Name</Text>
                  <Text style={styles.paymentValue}>{data.payment.bankName}</Text>
                </View>
                <View style={styles.paymentLine}>
                  <Text style={styles.paymentLabel}>Account Number</Text>
                  <Text style={styles.paymentValue}>{data.payment.accountNumber}</Text>
                </View>
                {data.payment.ifsc ? (
                  <View style={styles.paymentLine}>
                    <Text style={styles.paymentLabel}>IFSC</Text>
                    <Text style={styles.paymentValue}>{data.payment.ifsc}</Text>
                  </View>
                ) : null}
                <View style={styles.paymentLine}>
                  <Text style={styles.paymentLabel}>SWIFT</Text>
                  <Text style={styles.paymentValue}>{data.payment.swift}</Text>
                </View>
                <View style={styles.paymentLine}>
                  <Text style={styles.paymentLabel}>Bank Address</Text>
                  <Text style={styles.paymentValue}>{data.payment.bankAddress}</Text>
                </View>
              </View>
            </View>
            {data.notes ? (
              <View style={styles.colHalf}>
                <Text style={styles.label}>Notes</Text>
                <Text style={styles.notes}>{data.notes}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {data.footerText ? (
          <View style={styles.footerBar} fixed>
            <Text style={styles.footerText}>{data.footerText}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
