import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

export interface InvoicePDFData {
  number: string;
  status: string;
  date: string;
  dueDate: string;
  companyName: string;
  companySubtitle: string;
  companyEmail: string;
  companyPhone: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  items: {
    description: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  notes: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 4,
  },
  companyText: {
    fontSize: 9,
    color: "#64748b",
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "right",
    letterSpacing: 1,
  },
  invoiceNumber: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "right",
    marginTop: 2,
  },
  statusBadge: {
    marginTop: 6,
    alignSelf: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "#ecfdf5",
    color: "#059669",
    fontSize: 8,
    fontWeight: "bold",
  },
  grid3: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 16,
    marginBottom: 20,
  },
  col: {
    width: "30%",
  },
  label: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  valueBold: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e293b",
  },
  valueText: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  table: {
    width: "100%",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
    paddingVertical: 6,
  },
  thDesc: { width: "50%", fontSize: 9, color: "#64748b", fontWeight: "bold" },
  thQty: { width: "15%", fontSize: 9, color: "#64748b", fontWeight: "bold", textAlign: "center" },
  thPrice: { width: "17.5%", fontSize: 9, color: "#64748b", fontWeight: "bold", textAlign: "right" },
  thTotal: { width: "17.5%", fontSize: 9, color: "#64748b", fontWeight: "bold", textAlign: "right" },

  tdDesc: { width: "50%", fontSize: 9.5, color: "#334155" },
  tdQty: { width: "15%", fontSize: 9.5, color: "#64748b", textAlign: "center" },
  tdPrice: { width: "17.5%", fontSize: 9.5, color: "#64748b", textAlign: "right" },
  tdTotal: { width: "17.5%", fontSize: 9.5, color: "#1e293b", fontWeight: "bold", textAlign: "right" },

  summarySection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  summaryBox: {
    width: 200,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 9,
    color: "#334155",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
  },
  totalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#059669",
  },
  footerGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopStyle: "dashed",
    borderTopColor: "#cbd5e1",
    paddingTop: 16,
  },
});

export const InvoicePDFDocument: React.FC<{ data: InvoicePDFData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>{data.companyName}</Text>
          <Text style={styles.companyText}>{data.companySubtitle}</Text>
          <Text style={styles.companyText}>{data.companyEmail}</Text>
          <Text style={styles.companyText}>{data.companyPhone}</Text>
        </View>
        <View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>{data.number}</Text>
          <View style={styles.statusBadge}>
            <Text>{data.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Bill To & Dates */}
      <View style={styles.grid3}>
        <View style={styles.col}>
          <Text style={styles.label}>Bill To</Text>
          <Text style={styles.valueBold}>{data.clientName}</Text>
          <Text style={styles.valueText}>{data.clientEmail}</Text>
          <Text style={styles.valueText}>{data.clientAddress}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Invoice Date</Text>
          <Text style={styles.valueBold}>{data.date}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Due Date</Text>
          <Text style={styles.valueBold}>{data.dueDate}</Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.thDesc}>Description</Text>
          <Text style={styles.thQty}>Qty</Text>
          <Text style={styles.thPrice}>Price</Text>
          <Text style={styles.thTotal}>Total</Text>
        </View>
        {data.items.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.tdDesc}>{item.description}</Text>
            <Text style={styles.tdQty}>{item.quantity}</Text>
            <Text style={styles.tdPrice}>Rp {item.price.toLocaleString("id-ID")}</Text>
            <Text style={styles.tdTotal}>
              Rp {(item.quantity * item.price).toLocaleString("id-ID")}
            </Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>Rp {data.subtotal.toLocaleString("id-ID")}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.summaryValue}>Rp {data.discount.toLocaleString("id-ID")}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>Rp {data.tax.toLocaleString("id-ID")}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>Rp {data.total.toLocaleString("id-ID")}</Text>
          </View>
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footerGrid}>
        <View style={{ width: "48%" }}>
          <Text style={styles.label}>Payment Information</Text>
          <Text style={styles.valueText}>{data.bankName}</Text>
          <Text style={styles.valueText}>{data.accountNumber}</Text>
          <Text style={styles.valueText}>{data.accountHolder}</Text>
        </View>
        <View style={{ width: "48%" }}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.valueText}>{data.notes}</Text>
        </View>
      </View>
    </Page>
  </Document>
);
