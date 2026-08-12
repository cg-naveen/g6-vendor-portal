import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { InvoicePdfData } from "../types";

const YELLOW = "#f5c518";
const DARK = "#1a1a1a";

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  body: { paddingHorizontal: 40, paddingTop: 30 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: { width: 50, height: 50, objectFit: "contain" },
  brandFallback: { fontSize: 13, fontWeight: 700, color: DARK },

  banner: { flexDirection: "row", marginTop: 20, height: 34 },
  bannerYellow: { flex: 1, backgroundColor: YELLOW },
  bannerDark: { width: 130, backgroundColor: DARK, alignItems: "flex-end", justifyContent: "center", paddingRight: 18 },
  bannerTitle: { fontSize: 20, fontWeight: 800, color: "#ffffff", letterSpacing: 1 },

  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, marginBottom: 20 },
  invoiceToLabel: { fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 6 },
  value: { fontSize: 10, marginBottom: 2, color: "#3f3f46" },
  metaLabel: { fontSize: 9, fontWeight: 700, color: DARK },
  metaValue: { fontSize: 9, color: "#3f3f46", marginBottom: 6 },

  table: { marginTop: 6 },
  tableHeader: { flexDirection: "row", backgroundColor: DARK, paddingVertical: 8, paddingHorizontal: 10 },
  tableHeaderText: { color: "#ffffff", fontSize: 8, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottom: "0.5 solid #e5e5e5" },
  colSl: { width: "6%" },
  colDate: { width: "16%" },
  colDesc: { width: "38%" },
  colQty: { width: "10%", textAlign: "right" },
  colRate: { width: "15%", textAlign: "right" },
  colAmount: { width: "15%", textAlign: "right" },

  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  totalsBox: { width: 220 },
  totalLineDim: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalLineFinal: { flexDirection: "row", justifyContent: "space-between", backgroundColor: YELLOW, paddingVertical: 8, paddingHorizontal: 10, marginTop: 4 },
  totalLabelDim: { fontSize: 9, color: "#71717a" },
  totalValueDim: { fontSize: 9, color: "#3f3f46" },
  totalLabelFinal: { fontSize: 11, fontWeight: 800, color: DARK },
  totalValueFinal: { fontSize: 12, fontWeight: 800, color: DARK },

  lowerGrid: { flexDirection: "row", justifyContent: "space-between", marginTop: 30 },
  lowerCol: { width: "48%" },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: DARK, marginBottom: 6 },
  paymentLine: { fontSize: 9, color: "#3f3f46", marginBottom: 3 },

  signBox: { marginTop: 40, alignItems: "flex-end" },
  signImage: { width: 140, height: 50, objectFit: "contain", marginBottom: 4 },
  signLine: { width: 160, borderTop: "0.5 solid #a1a1aa", paddingTop: 4, textAlign: "center" },
  signText: { fontSize: 8, color: "#71717a" },

  notes: { marginTop: 18, fontSize: 9, color: "#71717a" },

  footerBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: DARK, paddingVertical: 12, paddingHorizontal: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#d4d4d8" },

  watermark: { position: "absolute", top: "45%", left: 0, right: 0, textAlign: "center", fontSize: 60, color: YELLOW, opacity: 0.35, transform: "rotate(-30deg)" },
});

export function BoldInvoice({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {data.watermarkText ? <Text style={styles.watermark}>{data.watermarkText}</Text> : null}

        <View style={styles.body}>
          <View style={styles.headerRow}>
            {data.logoDataUri ? <Image src={data.logoDataUri} style={styles.logo} /> : <Text style={styles.brandFallback}>{data.vendorDisplayName}</Text>}
          </View>

          <View style={styles.banner}>
            <View style={styles.bannerYellow} />
            <View style={styles.bannerDark}>
              <Text style={styles.bannerTitle}>INVOICE</Text>
            </View>
          </View>

          <View style={styles.sectionRow}>
            <View style={{ width: "48%" }}>
              <Text style={styles.invoiceToLabel}>Invoice To:</Text>
              <Text style={styles.value}>{data.billToName}</Text>
              {data.billToAddress ? <Text style={styles.value}>{data.billToAddress}</Text> : null}
              {data.billToEmail ? <Text style={styles.value}>{data.billToEmail}</Text> : null}
            </View>
            <View style={{ width: "48%", textAlign: "right" }}>
              <Text style={styles.metaLabel}>Invoice #</Text>
              <Text style={styles.metaValue}>{data.invoiceNumber}</Text>
              <Text style={styles.metaLabel}>Issue Date</Text>
              <Text style={styles.metaValue}>{data.issueDate}</Text>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaValue}>{data.dueDate}</Text>
            </View>
          </View>

          <View>
            <Text style={styles.metaLabel}>Biller Info</Text>
            <Text style={styles.value}>{data.vendorDisplayName}</Text>
            <Text style={styles.value}>{data.vendorAddress}</Text>
            <Text style={styles.value}>{data.vendorEmail} · {data.vendorPhone}</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colSl]}>SL.</Text>
              <Text style={[styles.tableHeaderText, styles.colDate]}>Date</Text>
              <Text style={[styles.tableHeaderText, styles.colDesc]}>Item Description</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Qty.</Text>
              <Text style={[styles.tableHeaderText, styles.colRate]}>Price</Text>
              <Text style={[styles.tableHeaderText, styles.colAmount]}>Total</Text>
            </View>
            {data.lineItems.map((item, i) => (
              <View style={styles.tableRow} key={i}>
                <Text style={styles.colSl}>{i + 1}</Text>
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
              <View style={styles.totalLineFinal}>
                <Text style={styles.totalLabelFinal}>Total</Text>
                <Text style={styles.totalValueFinal}>{data.total}</Text>
              </View>
            </View>
          </View>

          <View style={styles.lowerGrid}>
            <View style={styles.lowerCol}>
              <Text style={styles.sectionLabel}>Payment Info</Text>
              <Text style={styles.paymentLine}>A/C Name: {data.payment.accountHolderName}</Text>
              <Text style={styles.paymentLine}>Account #: {data.payment.accountNumber}</Text>
              <Text style={styles.paymentLine}>Bank Name: {data.payment.bankName}</Text>
              {data.payment.ifsc ? <Text style={styles.paymentLine}>IFSC: {data.payment.ifsc}</Text> : null}
              <Text style={styles.paymentLine}>SWIFT: {data.payment.swift}</Text>
            </View>
            <View style={[styles.lowerCol, { alignItems: "flex-end" }]}>
              {data.notes ? (
                <View style={styles.notes}>
                  <Text style={styles.sectionLabel}>Notes</Text>
                  <Text>{data.notes}</Text>
                </View>
              ) : null}
              <View style={styles.signBox}>
                {data.signatureDataUri ? <Image src={data.signatureDataUri} style={styles.signImage} /> : null}
                <View style={styles.signLine}>
                  <Text style={styles.signText}>Authorised Sign</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {data.footerText ? (
          <View style={styles.footerBar} fixed>
            <Text style={styles.footerText}>{data.vendorPhone}</Text>
            <Text style={styles.footerText}>{data.footerText}</Text>
            <Text style={styles.footerText}>{data.vendorEmail}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
