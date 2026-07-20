import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

export type ReceiptPdfData = {
  receiptNumber: string;
  paidDate: string;
  payerName: string;
  payerAddress: string;
  referenceLabel: string;
  referenceNumber: string;
  amountPaid: string;
  transactionFee: string;
  netAmount: string;
  billFromName: string;
  billFromAddress: string;
  logoDataUri?: string | null;
};

const styles = StyleSheet.create({
  page: { padding: 44, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, borderBottom: "2 solid #1f2937", paddingBottom: 16 },
  logo: { width: 70, height: 70, objectFit: "contain", marginBottom: 6 },
  title: { fontSize: 22, fontWeight: 700, color: "#1f2937", letterSpacing: 1 },
  metaBox: { textAlign: "right" },
  label: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", marginBottom: 3, letterSpacing: 0.5 },
  value: { fontSize: 10, marginBottom: 2 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  box: { border: "1 solid #e5e7eb", borderRadius: 4, padding: 16, marginTop: 10 },
  line: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottom: "0.5 solid #e5e7eb" },
  lineLabel: { fontSize: 11, color: "#4b5563" },
  lineValue: { fontSize: 11 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", paddingTop: 10 },
  totalLabel: { fontSize: 13, fontWeight: 700 },
  totalValue: { fontSize: 13, fontWeight: 700 },
  footer: { position: "absolute", bottom: 30, left: 44, right: 44, textAlign: "center", fontSize: 8, color: "#9ca3af" },
});

export function Receipt({ data }: { data: ReceiptPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            {data.logoDataUri ? <Image src={data.logoDataUri} style={styles.logo} /> : null}
            <Text style={styles.title}>PAYMENT RECEIPT</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.label}>Receipt Number</Text>
            <Text style={styles.value}>{data.receiptNumber}</Text>
            <Text style={styles.label}>Date Paid</Text>
            <Text style={styles.value}>{data.paidDate}</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={{ width: "48%" }}>
            <Text style={styles.label}>Issued By</Text>
            <Text style={styles.value}>{data.billFromName}</Text>
            <Text style={styles.value}>{data.billFromAddress}</Text>
          </View>
          <View style={{ width: "48%", textAlign: "right" }}>
            <Text style={styles.label}>Paid To</Text>
            <Text style={styles.value}>{data.payerName}</Text>
            <Text style={styles.value}>{data.payerAddress}</Text>
          </View>
        </View>

        <Text style={styles.label}>Reference</Text>
        <Text style={styles.value}>
          {data.referenceLabel}: {data.referenceNumber}
        </Text>

        <View style={styles.box}>
          <View style={styles.line}>
            <Text style={styles.lineLabel}>Amount Paid</Text>
            <Text style={styles.lineValue}>{data.amountPaid}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.lineLabel}>Transaction Fee</Text>
            <Text style={styles.lineValue}>-{data.transactionFee}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Net Amount</Text>
            <Text style={styles.totalValue}>{data.netAmount}</Text>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          This receipt confirms payment has been recorded by G6 Labs Asia.
        </Text>
      </Page>
    </Document>
  );
}
