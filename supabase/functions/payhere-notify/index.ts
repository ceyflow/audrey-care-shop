// payhere-notify: PayHere calls this URL (server to server) after every payment attempt.
// We only trust it after checking PayHere's signature (md5sig) and the amount.
import { createHash } from "node:crypto";
import { db, esc, money, notifyOwner } from "../_shared/util.ts";

const md5Upper = (s: string) => createHash("md5").update(s).digest("hex").toUpperCase();

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const merchantId = Deno.env.get("PAYHERE_MERCHANT_ID");
  const merchantSecret = Deno.env.get("PAYHERE_MERCHANT_SECRET");
  if (!merchantId || !merchantSecret) return new Response("Not configured", { status: 503 });

  const f = new URLSearchParams(await req.text());
  const orderNo = f.get("order_id") ?? "";
  const amount = f.get("payhere_amount") ?? "";
  const currency = f.get("payhere_currency") ?? "";
  const status = f.get("status_code") ?? "";
  const sig = (f.get("md5sig") ?? "").toUpperCase();

  const expected = md5Upper(`${f.get("merchant_id") ?? ""}${orderNo}${amount}${currency}${status}${md5Upper(merchantSecret)}`);
  if (f.get("merchant_id") !== merchantId || sig !== expected) {
    console.error("payhere-notify: bad signature for", orderNo);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = db();
  const { data: order } = await supabase.from("orders").select("id,order_no,total_lkr,payment_status,customer_name").eq("order_no", orderNo).maybeSingle();
  if (!order) return new Response("Unknown order", { status: 404 });
  if (order.payment_status === "paid") return new Response("OK"); // already handled

  // status_code: 2 success, 0 pending, -1 cancelled, -2 failed, -3 charged back
  if (status === "2") {
    if (amount !== Number(order.total_lkr).toFixed(2) || currency !== "LKR") {
      console.error("payhere-notify: amount mismatch for", orderNo, amount, currency);
      return new Response("Amount mismatch", { status: 400 });
    }
    await supabase.from("orders").update({
      payment_status: "paid", status: "confirmed", payhere_payment_id: f.get("payment_id"), updated_at: new Date().toISOString(),
    }).eq("id", order.id);
    await notifyOwner(
      `Payment received — ${order.order_no} (${money(order.total_lkr)})`,
      `<p>Card payment of <b>${money(order.total_lkr)}</b> confirmed for order <b>${esc(order.order_no)}</b> (${esc(order.customer_name)}).</p>`,
    );
  } else if (status === "-2" || status === "-1") {
    await supabase.from("orders").update({ payment_status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
  }
  return new Response("OK");
});
