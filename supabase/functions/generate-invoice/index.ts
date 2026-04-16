// Generates a branded GST tax invoice PDF, uploads to storage, inserts invoice row.
// Called by the webhook (with service role JWT) after a successful payment.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MERCHANT_GSTIN = Deno.env.get("MERCHANT_GSTIN") || "";
const MERCHANT_NAME = Deno.env.get("MERCHANT_BUSINESS_NAME") || "FinTrack+";
const MERCHANT_ADDRESS = Deno.env.get("MERCHANT_ADDRESS") || "";
const MERCHANT_STATE_CODE = Deno.env.get("MERCHANT_STATE_CODE") || "";

const GST_RATE = 18; // 18% GST inclusive
const PLAN_DESCRIPTION = "FinTrack+ Subscription (Monthly)";

function fmtINR(n: number): string {
  return "INR " + n.toFixed(2);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { org_id, subscription_id, razorpay_payment_id, amount_paise } = body;
    if (!org_id || !razorpay_payment_id || !amount_paise) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Idempotency: skip if invoice for this payment already exists
    const { data: existing } = await admin
      .from("invoices")
      .select("id")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: sub } = await admin
      .from("subscriptions")
      .select("*")
      .eq("org_id", org_id)
      .maybeSingle();
    if (!sub) throw new Error("Subscription not found");

    // Tax calculation: GST inclusive
    const total = amount_paise / 100; // e.g. 599
    const net = +(total / (1 + GST_RATE / 100)).toFixed(2);
    const gst = +(total - net).toFixed(2);

    const sameState = sub.customer_state_code && MERCHANT_STATE_CODE && sub.customer_state_code === MERCHANT_STATE_CODE;
    const gstType = sameState ? "CGST_SGST" : "IGST";
    const cgst = sameState ? +(gst / 2).toFixed(2) : 0;
    const sgst = sameState ? +(gst / 2).toFixed(2) : 0;
    const igst = sameState ? 0 : gst;

    // Get next invoice number
    const { data: invoiceNumberData, error: numErr } = await admin.rpc("next_invoice_number");
    if (numErr) throw new Error("Failed to generate invoice number: " + numErr.message);
    const invoiceNumber = invoiceNumberData as string;

    // ===== PDF Generation =====
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const brand = rgb(0.086, 0.396, 0.722); // #1665B8
    const dark = rgb(0.12, 0.16, 0.22);
    const muted = rgb(0.45, 0.5, 0.58);
    const line = rgb(0.85, 0.87, 0.9);

    // Header bar
    page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: brand });
    page.drawText("FinTrack+", { x: 40, y: height - 50, size: 28, font: bold, color: rgb(1, 1, 1) });
    page.drawText("Tax Invoice", { x: 40, y: height - 75, size: 12, font, color: rgb(1, 1, 1) });

    page.drawText(invoiceNumber, { x: width - 200, y: height - 50, size: 14, font: bold, color: rgb(1, 1, 1) });
    const issueDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    page.drawText(`Issued: ${issueDate}`, { x: width - 200, y: height - 70, size: 10, font, color: rgb(1, 1, 1) });

    // From section
    let y = height - 130;
    page.drawText("From", { x: 40, y, size: 9, font: bold, color: muted });
    y -= 14;
    page.drawText(MERCHANT_NAME, { x: 40, y, size: 11, font: bold, color: dark });
    y -= 13;
    if (MERCHANT_ADDRESS) {
      const addrLines = MERCHANT_ADDRESS.split(/,|\n/).map(s => s.trim()).filter(Boolean);
      for (const ln of addrLines.slice(0, 4)) {
        page.drawText(ln, { x: 40, y, size: 9, font, color: dark });
        y -= 12;
      }
    }
    if (MERCHANT_GSTIN) {
      page.drawText(`GSTIN: ${MERCHANT_GSTIN}`, { x: 40, y, size: 9, font: bold, color: dark });
      y -= 12;
    }

    // To section
    let yTo = height - 130;
    page.drawText("Billed To", { x: 320, y: yTo, size: 9, font: bold, color: muted });
    yTo -= 14;
    const toName = sub.customer_business_name || "FinTrack+ Customer";
    page.drawText(toName, { x: 320, y: yTo, size: 11, font: bold, color: dark });
    yTo -= 13;
    if (sub.customer_address) {
      const addrLines = sub.customer_address.split(/,|\n/).map((s: string) => s.trim()).filter(Boolean);
      for (const ln of addrLines.slice(0, 4)) {
        page.drawText(ln, { x: 320, y: yTo, size: 9, font, color: dark });
        yTo -= 12;
      }
    }
    if (sub.customer_gstin) {
      page.drawText(`GSTIN: ${sub.customer_gstin}`, { x: 320, y: yTo, size: 9, font: bold, color: dark });
      yTo -= 12;
    }

    // Line items table
    const tableY = Math.min(y, yTo) - 30;
    page.drawRectangle({ x: 40, y: tableY - 6, width: width - 80, height: 22, color: rgb(0.96, 0.97, 0.99) });
    page.drawText("Description", { x: 50, y: tableY, size: 10, font: bold, color: dark });
    page.drawText("HSN/SAC", { x: 320, y: tableY, size: 10, font: bold, color: dark });
    page.drawText("Amount", { x: width - 100, y: tableY, size: 10, font: bold, color: dark });

    let itemY = tableY - 30;
    page.drawText(PLAN_DESCRIPTION, { x: 50, y: itemY, size: 10, font, color: dark });
    page.drawText("998314", { x: 320, y: itemY, size: 10, font, color: dark });
    page.drawText(fmtINR(net), { x: width - 100, y: itemY, size: 10, font, color: dark });

    itemY -= 25;
    page.drawLine({ start: { x: 40, y: itemY }, end: { x: width - 40, y: itemY }, thickness: 0.5, color: line });

    // Tax breakdown (right aligned)
    let tY = itemY - 18;
    const labelX = width - 220;
    const valueX = width - 100;

    page.drawText("Subtotal", { x: labelX, y: tY, size: 10, font, color: muted });
    page.drawText(fmtINR(net), { x: valueX, y: tY, size: 10, font, color: dark });
    tY -= 16;

    if (gstType === "CGST_SGST") {
      page.drawText(`CGST @ ${GST_RATE / 2}%`, { x: labelX, y: tY, size: 10, font, color: muted });
      page.drawText(fmtINR(cgst), { x: valueX, y: tY, size: 10, font, color: dark });
      tY -= 16;
      page.drawText(`SGST @ ${GST_RATE / 2}%`, { x: labelX, y: tY, size: 10, font, color: muted });
      page.drawText(fmtINR(sgst), { x: valueX, y: tY, size: 10, font, color: dark });
      tY -= 16;
    } else {
      page.drawText(`IGST @ ${GST_RATE}%`, { x: labelX, y: tY, size: 10, font, color: muted });
      page.drawText(fmtINR(igst), { x: valueX, y: tY, size: 10, font, color: dark });
      tY -= 16;
    }

    page.drawLine({ start: { x: labelX, y: tY + 4 }, end: { x: width - 40, y: tY + 4 }, thickness: 0.5, color: line });
    tY -= 4;
    page.drawText("Total Paid", { x: labelX, y: tY, size: 12, font: bold, color: brand });
    page.drawText(fmtINR(total), { x: valueX, y: tY, size: 12, font: bold, color: brand });

    // Payment info
    tY -= 50;
    page.drawText("Payment Information", { x: 40, y: tY, size: 9, font: bold, color: muted });
    tY -= 14;
    page.drawText(`Payment ID: ${razorpay_payment_id}`, { x: 40, y: tY, size: 9, font, color: dark });
    tY -= 12;
    page.drawText(`Status: Paid`, { x: 40, y: tY, size: 9, font, color: dark });

    // Footer
    page.drawRectangle({ x: 0, y: 0, width, height: 50, color: rgb(0.96, 0.97, 0.99) });
    page.drawText("This is a computer-generated invoice and does not require a signature.", {
      x: 40, y: 30, size: 8, font, color: muted,
    });
    page.drawText("Thank you for using FinTrack+", { x: 40, y: 16, size: 8, font, color: muted });

    const pdfBytes = await pdfDoc.save();

    // Upload to storage
    const pdfPath = `${org_id}/${invoiceNumber.replace(/\//g, "-")}.pdf`;
    const { error: uploadErr } = await admin.storage
      .from("invoices")
      .upload(pdfPath, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (uploadErr) throw new Error("Upload failed: " + uploadErr.message);

    // Insert invoice row
    const { error: insertErr } = await admin.from("invoices").insert({
      org_id,
      subscription_id,
      razorpay_payment_id,
      invoice_number: invoiceNumber,
      amount_total: total,
      amount_net: net,
      gst_amount: gst,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: igst,
      gst_type: gstType,
      gst_rate: GST_RATE,
      customer_gstin: sub.customer_gstin,
      customer_business_name: sub.customer_business_name,
      customer_address: sub.customer_address,
      pdf_path: pdfPath,
    });
    if (insertErr) throw new Error("Invoice insert failed: " + insertErr.message);

    return new Response(JSON.stringify({ ok: true, invoice_number: invoiceNumber, pdf_path: pdfPath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[generate-invoice]", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
