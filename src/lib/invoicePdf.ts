import jsPDF from "jspdf";
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
 * Generates and downloads a clean, professional PDF invoice for PRATHOMIX MasmSpace.
 * Output file: PRATHOMIX_Invoice_[InvoiceID].pdf
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

  const billedEmail = userEmail || "customer@masmspace.online";
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
  const contentWidth = pageWidth - margin * 2; // 170mm

  // Top cyan brand accent line
  doc.setFillColor(6, 182, 212); // #06b6d4
  doc.rect(0, 0, pageWidth, 4, "F");

  // --- HEADER SECTION ---
  // Brand Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42); // #0f172a slate-900
  doc.text("PRATHOMIX", margin, 24);

  // Subtitle / Brand Website
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // #64748b slate-500
  doc.text("masmspace.online", margin, 30);
  doc.text("AI Code Studio & Spatial Multiplayer Canvas", margin, 35);

  // Right Header: INVOICE / RECEIPT
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59); // #1e293b
  doc.text("RECEIPT / INVOICE", pageWidth - margin, 24, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Invoice ID: ${invoiceId}`, pageWidth - margin, 31, { align: "right" });
  doc.text(`Date: ${invoiceDate}`, pageWidth - margin, 36, { align: "right" });

  // Divider line below header
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.setLineWidth(0.5);
  doc.line(margin, 43, pageWidth - margin, 43);

  // --- STATUS BADGE & CUSTOMER DETAILS ---
  const detailsStartY = 53;

  // Billed To Section (Left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("BILLED TO:", margin, detailsStartY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(billedEmail, margin, detailsStartY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("PRATHOMIX Verified Account", margin, detailsStartY + 11);

  // Status Badge Stamp (Right): "Status: PAID" in green
  const badgeWidth = 44;
  const badgeHeight = 14;
  const badgeX = pageWidth - margin - badgeWidth;
  const badgeY = detailsStartY - 4;

  // Soft emerald background box
  doc.setFillColor(236, 253, 245); // #ecfdf5 (emerald-50)
  doc.setDrawColor(16, 185, 129); // #10b981 (emerald-500)
  doc.setLineWidth(0.8);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2.5, 2.5, "FD");

  // Status Stamp Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87); // #047857 (emerald-700)
  doc.text("STATUS: PAID", badgeX + badgeWidth / 2, badgeY + 9, { align: "center" });

  // --- TRANSACTION TABLE ---
  const tableStartY = 78;
  const rowHeight = 11;

  // Table Header Background
  doc.setFillColor(248, 250, 252); // #f8fafc slate-50
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.setLineWidth(0.3);
  doc.rect(margin, tableStartY, contentWidth, 9, "FD");

  // Table Header Columns
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // #475569 slate-600

  const colDesc = margin + 4;
  const colQty = margin + 105;
  const colRate = margin + 130;
  const colTotal = pageWidth - margin - 4;

  doc.text("ITEM / SUBSCRIPTION TIER", colDesc, tableStartY + 6);
  doc.text("QTY", colQty, tableStartY + 6);
  doc.text("AMOUNT", colRate, tableStartY + 6);
  doc.text("TOTAL", colTotal, tableStartY + 6, { align: "right" });

  // Table Item Row
  const itemRowY = tableStartY + 9;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(241, 245, 249);
  doc.rect(margin, itemRowY, contentWidth, rowHeight, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(tierDescription, colDesc, itemRowY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("1", colQty, itemRowY + 7);
  doc.text(totalAmount, colRate, itemRowY + 7);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(totalAmount, colTotal, itemRowY + 7, { align: "right" });

  // Subtitle info below row
  const row2Y = itemRowY + rowHeight;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, row2Y, contentWidth, 8, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // #94a3b8 slate-400
  doc.text("Includes unlimited AI actions, real-time multiplayer whiteboard, and multi-language Code Studio.", colDesc, row2Y + 5.5);

  // --- TOTALS & SUMMARY ---
  const totalsStartY = row2Y + 16;
  const totalsLabelX = pageWidth - margin - 60;
  const totalsValX = pageWidth - margin - 4;

  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Subtotal:", totalsLabelX, totalsStartY);
  doc.text(totalAmount, totalsValX, totalsStartY, { align: "right" });

  // Tax
  doc.text("Estimated Tax / VAT (0%):", totalsLabelX, totalsStartY + 6);
  doc.text("$0.00 USD", totalsValX, totalsStartY + 6, { align: "right" });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(totalsLabelX, totalsStartY + 9, pageWidth - margin, totalsStartY + 9);

  // Total Paid
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Total Paid:", totalsLabelX, totalsStartY + 15);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(totalAmount, totalsValX, totalsStartY + 15, { align: "right" });

  // Payment method note
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Payment Method: Online Checkout (Razorpay / Instant Transfer)", totalsLabelX - 25, totalsStartY + 21);

  // --- FOOTER SECTION ---
  const footerY = 265;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Thank you for your business with PRATHOMIX!", margin, footerY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "PRATHOMIX Cloud Platform • masmspace.online • For inquiries, email: support@masmspace.online",
    margin,
    footerY + 11
  );

  // 3. Trigger Browser Download
  const filename = `PRATHOMIX_Invoice_${invoiceId}.pdf`;
  doc.save(filename);

  return filename;
}
