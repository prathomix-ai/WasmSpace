import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@/lib/supabase/client";

export interface InvoiceItem {
  id: string;
  date: string;
  amount: string;
  tier?: string;
  status?: string;
  customerEmail?: string;
}

/**
 * Generates and downloads a modern, premium SaaS receipt PDF for MasmSpace (Powered by PRATHOMIX).
 * Styled after Stripe / Vercel minimalist invoices.
 * Output file: MasmSpace_Invoice_[InvoiceID].pdf
 */
export async function downloadInvoicePdf(invoice: InvoiceItem): Promise<string> {
  // 1. Resolve customer email from parameter or active Supabase session
  let userEmail = invoice.customerEmail;
  if (!userEmail) {
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      userEmail = sessionData?.session?.user?.email;

      if (!userEmail) {
        const { data: userData } = await supabase.auth.getUser();
        userEmail = userData?.user?.email;
      }
    } catch (err) {
      console.warn("[downloadInvoicePdf] Could not fetch Supabase session email:", err);
    }
  }

  const billedEmail = userEmail || "customer@prathomix.tech";
  const tierDescription = invoice.tier || "MasmSpace PRO - 1 Month";
  const invoiceId = invoice.id || "INV-0000";
  const invoiceDate = invoice.date || new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const totalAmount = invoice.amount || "$5.00 USD";

  // 2. Initialize jsPDF (A4 page: 210mm x 297mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 20;

  // ── 1. PREMIUM HEADER & BRANDING (Clean, modern, no heavy colored top bar) ──
  // Left side: Brand name & website
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // #0f172a slate-900
  doc.text("MasmSpace", margin, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139); // #64748b slate-500
  doc.text("Powered by PRATHOMIX", margin, 32);

  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // #94a3b8 slate-400
  doc.text("Next-Gen Collaborative Canvas & AI Code OS", margin, 37);

  // Right side: Sleek muted RECEIPT / INVOICE metadata
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(71, 85, 105); // #475569 slate-600
  doc.text("RECEIPT / INVOICE", pageWidth - margin, 26, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Invoice ID: ${invoiceId}`, pageWidth - margin, 32, { align: "right" });
  doc.text(`Date: ${invoiceDate}`, pageWidth - margin, 37, { align: "right" });

  // Elegant Divider Line Below Header
  doc.setDrawColor(226, 232, 240); // #e2e8f0 slate-200
  doc.setLineWidth(0.35);
  doc.line(margin, 44, pageWidth - margin, 44);

  // ── 2. BILLED TO & MODERN "PAID" BADGE ──
  const detailsY = 55;

  // Billed To Info (Left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // #94a3b8 slate-400
  doc.text("BILLED TO", margin, detailsY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text(billedEmail, margin, detailsY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text("Verified Account • MasmSpace Cloud", margin, detailsY + 11);

  // Modern "PAID" Badge (Right): Soft pastel green background with bold dark green text in rounded rectangle
  const badgeWidth = 36;
  const badgeHeight = 9.5;
  const badgeX = pageWidth - margin - badgeWidth;
  const badgeY = detailsY - 2;

  // Soft pastel green background (#ecfdf5) with fine border (#a7f3d0)
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.setLineWidth(0.35);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2.5, 2.5, "FD");

  // Bold dark green text (#065f46)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70);
  doc.text("STATUS: PAID", badgeX + badgeWidth / 2, badgeY + 6.2, { align: "center" });

  // ── 3. MINIMALIST TABLE STYLING VIA jspdf-autotable ──
  autoTable(doc, {
    startY: 76,
    margin: { left: margin, right: margin },
    head: [["ITEM DESCRIPTION", "QTY", "RATE", "AMOUNT"]],
    body: [
      [
        {
          content: `${tierDescription}\nIncludes unlimited AI architecture generation, Pyodide WASM runtime, and 4K vector exports.`,
          styles: { fontStyle: "normal" },
        },
        "1",
        totalAmount,
        totalAmount,
      ],
    ],
    theme: "plain",
    headStyles: {
      fillColor: [244, 244, 245], // #f4f4f5 very subtle light gray
      textColor: [71, 85, 105],   // #475569 slate-600
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: { top: 4.5, bottom: 4.5, left: 5, right: 5 },
      lineColor: [226, 232, 240], // #e2e8f0
      lineWidth: { bottom: 0.35, top: 0, left: 0, right: 0 },
    },
    bodyStyles: {
      textColor: [15, 23, 42],    // #0f172a slate-900
      fontSize: 9,
      cellPadding: { top: 6, bottom: 6, left: 5, right: 5 },
      lineColor: [241, 245, 249], // #f1f5f9 subtle bottom divider
      lineWidth: { bottom: 0.35, top: 0, left: 0, right: 0 },
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 25, halign: "right" },
      3: { cellWidth: 25, halign: "right", fontStyle: "bold" },
    },
  });

  // ── 4. TOTALS & SUMMARY SECTION ──
  const finalY = (doc as any).lastAutoTable?.finalY || 105;
  const totalsY = finalY + 12;
  const totalsLabelX = pageWidth - margin - 65;
  const totalsValX = pageWidth - margin;

  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Subtotal:", totalsLabelX, totalsY);
  doc.text(totalAmount, totalsValX, totalsY, { align: "right" });

  // Tax / VAT (0%)
  doc.text("Estimated Tax / VAT (0%):", totalsLabelX, totalsY + 6);
  doc.text("$0.00 USD", totalsValX, totalsY + 6, { align: "right" });

  // Light divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.line(totalsLabelX, totalsY + 9.5, pageWidth - margin, totalsY + 9.5);

  // Emphasized Total Paid (Primary brand cyan/teal accent)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Total Paid:", totalsLabelX, totalsY + 16.5);

  doc.setFontSize(13);
  doc.setTextColor(8, 145, 178); // #0891b2 (Cyan-600 brand accent)
  doc.text(totalAmount, totalsValX, totalsY + 16.5, { align: "right" });

  // Payment note
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // #94a3b8
  doc.text("Payment Method: Card Checkout (Instant Transfer)", totalsLabelX - 20, totalsY + 23);

  // ── 5. EMAIL & FOOTER SECTION (Subtle, gray, centered, with light divider) ──
  const footerY = 270;

  // Clean, light gray divider line above footer
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.setLineWidth(0.35);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Centered subtle footer text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // #94a3b8
  doc.text("Thank you for choosing MasmSpace, powered by PRATHOMIX.", pageWidth / 2, footerY + 6.5, {
    align: "center",
  });

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // #94a3b8
  doc.text(
    "PRATHOMIX SOLUTION • MasmSpace Platform • For inquiries: support@prathomix.tech",
    pageWidth / 2,
    footerY + 11.5,
    { align: "center" }
  );

  // 3. Trigger Browser Download
  const filename = `MasmSpace_Invoice_${invoiceId}.pdf`;
  doc.save(filename);

  return filename;
}
