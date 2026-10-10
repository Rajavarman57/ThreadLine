import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInvoiceDetail, InvoiceDetail } from "@/services/payments";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

export const dynamic = "force-dynamic";

// Define styles for standard professional invoice layout
const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1e293b",
    lineHeight: 1.4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 0.5,
  },
  companySubtitle: {
    fontSize: 8.5,
    color: "#64748b",
    marginTop: 2,
  },
  invoiceTitleBlock: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  invoiceNumber: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#2563eb",
    marginTop: 3,
  },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metaCol: {
    width: "48%",
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 2,
  },
  partyName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  partyText: {
    fontSize: 8.5,
    color: "#475569",
    marginBottom: 1.5,
  },
  statusBadge: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    alignSelf: "flex-start",
    fontSize: 8,
    fontWeight: "bold",
  },
  table: {
    marginTop: 10,
    marginBottom: 15,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    borderRadius: 3,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  colNo: { width: "8%" },
  colRoll: { width: "24%" },
  colQty: { width: "18%", textAlign: "right" },
  colRate: { width: "22%", textAlign: "right" },
  colAmount: { width: "28%", textAlign: "right" },
  thText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
  },
  tdText: {
    fontSize: 8.5,
    color: "#1e293b",
  },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  totalsBox: {
    width: "45%",
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    borderRadius: 3,
    padding: 8,
    backgroundColor: "#f8fafc",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingVertical: 1,
  },
  totalRowFinal: {
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    marginTop: 4,
    paddingTop: 5,
  },
  totalsLabel: {
    fontSize: 8.5,
    color: "#64748b",
  },
  totalsValue: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#0f172a",
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
  },
  footerNote: {
    marginTop: 25,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    fontSize: 7.5,
    color: "#94a3b8",
    textAlign: "center",
  },
});

interface InvoicePDFProps {
  invoice: InvoiceDetail;
}

function InvoicePDFDocument({ invoice }: InvoicePDFProps) {
  const rolls = invoice.rolls || [];
  const ratePerMetre = invoice.order.ratePerMetre;

  return (
    <Document title={`Invoice-${invoice.invoiceNo}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>Everest Textile Mills</Text>
            <Text style={styles.companySubtitle}>
              Mill Road, Industrial Area, Sector 4, Surat, Gujarat
            </Text>
            <Text style={styles.companySubtitle}>
              Contact: contact@everestmills.test
            </Text>
          </View>
          <View style={styles.invoiceTitleBlock}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNo}</Text>
            <Text style={styles.partyText}>
              Date:{" "}
              {new Date(invoice.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        {/* Metadata Grid */}
        <View style={styles.metaGrid}>
          {/* Bill To */}
          <View style={styles.metaCol}>
            <Text style={styles.sectionTitle}>Billed To / Consignee</Text>
            <Text style={styles.partyName}>{invoice.order.buyer.name}</Text>
            {invoice.order.buyer.address ? (
              <Text style={styles.partyText}>{invoice.order.buyer.address}</Text>
            ) : null}
            {invoice.order.buyer.phone ? (
              <Text style={styles.partyText}>
                Phone: {invoice.order.buyer.phone}
              </Text>
            ) : null}
            {invoice.order.buyer.email ? (
              <Text style={styles.partyText}>
                Email: {invoice.order.buyer.email}
              </Text>
            ) : null}
          </View>

          {/* Dispatch & Order Details */}
          <View style={styles.metaCol}>
            <Text style={styles.sectionTitle}>Dispatch & Order Details</Text>
            <Text style={styles.partyText}>
              Order No: {invoice.order.orderNo}
            </Text>
            <Text style={styles.partyText}>
              Dispatch No: {invoice.dispatchNo}
            </Text>
            <Text style={styles.partyText}>
              Vehicle No: {invoice.vehicleNo}
            </Text>
            <Text style={styles.partyText}>
              Driver: {invoice.driver}
            </Text>
            <Text style={styles.partyText}>
              Fabric: {invoice.order.fabricType} ({invoice.order.colour})
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    invoice.status === "PAID"
                      ? "#dcfce7"
                      : invoice.status === "PARTIAL"
                      ? "#fef3c7"
                      : "#fee2e2",
                  color:
                    invoice.status === "PAID"
                      ? "#15803d"
                      : invoice.status === "PARTIAL"
                      ? "#b45309"
                      : "#b91c1c",
                },
              ]}
            >
              <Text>PAYMENT STATUS: {invoice.status}</Text>
            </View>
          </View>
        </View>

        {/* Dispatch Lines Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colNo]}>#</Text>
            <Text style={[styles.thText, styles.colRoll]}>Roll Number</Text>
            <Text style={[styles.thText, styles.colQty]}>Length (m)</Text>
            <Text style={[styles.thText, styles.colRate]}>Rate/m (INR)</Text>
            <Text style={[styles.thText, styles.colAmount]}>Amount (INR)</Text>
          </View>

          {rolls.map((roll, idx) => {
            const lineAmount = roll.lengthM * ratePerMetre;
            return (
              <View
                key={roll.id}
                style={[
                  styles.tableRow,
                  idx % 2 === 1 ? styles.tableRowAlt : {},
                ]}
              >
                <Text style={[styles.tdText, styles.colNo]}>{idx + 1}</Text>
                <Text style={[styles.tdText, styles.colRoll]}>{roll.rollNo}</Text>
                <Text style={[styles.tdText, styles.colQty]}>
                  {roll.lengthM.toLocaleString()} m
                </Text>
                <Text style={[styles.tdText, styles.colRate]}>
                  {ratePerMetre.toFixed(2)}
                </Text>
                <Text style={[styles.tdText, styles.colAmount]}>
                  {lineAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Total Dispatched:</Text>
              <Text style={styles.totalsValue}>
                {invoice.totalMetres.toLocaleString()} m ({rolls.length} rolls)
              </Text>
            </View>

            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal:</Text>
              <Text style={styles.totalsValue}>
                {invoice.subtotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax ({invoice.taxPct}%):</Text>
              <Text style={styles.totalsValue}>
                {invoice.taxAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View style={[styles.totalsRow, styles.totalRowFinal]}>
              <Text
                style={[
                  styles.totalsLabel,
                  { fontWeight: "bold", color: "#0f172a" },
                ]}
              >
                Invoice Total:
              </Text>
              <Text style={styles.grandTotalValue}>
                {invoice.total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Amount Paid:</Text>
              <Text style={[styles.totalsValue, { color: "#16a34a" }]}>
                {invoice.paidAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Balance Outstanding:</Text>
              <Text
                style={[
                  styles.totalsValue,
                  { color: invoice.outstanding > 0 ? "#dc2626" : "#16a34a" },
                ]}
              >
                {invoice.outstanding.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerNote}>
          <Text>
            This is a computer-generated tax invoice generated dynamically by
            Everest Textile Mills ERP. No physical signature is required.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;
    const invoice = await getInvoiceDetail(id);

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    // Role-based authorization
    const role = session.user.role;
    const internalRoles = ["ADMIN", "ACCOUNTS", "STORE", "SUPERVISOR", "QC"];

    if (role === "BUYER") {
      // A buyer can ONLY access their own invoices
      if (!session.user.buyerId || invoice.order.buyer.id !== session.user.buyerId) {
        return new NextResponse("Forbidden: Access denied to this invoice", {
          status: 403,
        });
      }
    } else if (!internalRoles.includes(role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Render PDF to Buffer
    const buffer = await renderToBuffer(<InvoicePDFDocument invoice={invoice} />);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNo}.pdf"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Failed to generate invoice PDF:", error);
    return new NextResponse("Internal Server Error generating PDF", {
      status: 500,
    });
  }
}
