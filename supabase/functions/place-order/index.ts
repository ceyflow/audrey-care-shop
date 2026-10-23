// place-order: validates a cart against the database prices, creates the order, and (for card
// payments) returns the signed PayHere form fields. The browser never decides a price.
import { createHash } from "node:crypto";
import { clip, cors, db, esc, json, money, notifyOwner } from "../_shared/util.ts";

const md5Upper = (s: string) => createHash("md5").update(s).digest("hex").toUpperCase();
const METHODS = ["cod", "bank_transfer", "card"] as const;
type Method = typeof METHODS[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  if (b?.hp) return json({ error: "Could not place order" }, 400); // honeypot

  // ---- validate input --------------------------------------------------------------------
  const name = clip(b?.customer?.name, 120);
  const phone = clip(b?.customer?.phone, 20);
  const email = clip(b?.customer?.email, 200);
  const address = clip(b?.shipping?.address, 300);
  const city = clip(b?.shipping?.city, 100);
  const district = clip(b?.shipping?.district, 60);
  const postal = clip(b?.shipping?.postal, 12);
  const notes = clip(b?.notes, 500);
  const method = b?.payment_method as Method;

  if (name.length < 2) return json({ error: "Please enter your name." }, 400);
  if (!/^0\d{9}$/.test(phone)) return json({ error: "Please enter a valid mobile number." }, 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: "Please enter a valid email address." }, 400);
  if (address.length < 5 || city.length < 2 || !district) return json({ error: "Please complete your delivery address." }, 400);
  if (!METHODS.includes(method)) return json({ error: "Please choose a payment method." }, 400);
  if (method === "card" && !email) return json({ error: "An email address is needed for card payments." }, 400);

  const items: { variant_id: string; qty: number }[] = Array.isArray(b?.items) ? b.items : [];
  if (!items.length || items.length > 30) return json({ error: "Your bag is empty." }, 400);
  for (const it of items) {
    if (typeof it?.variant_id !== "string" || !Number.isInteger(it?.qty) || it.qty < 1 || it.qty > 50) {
      return json({ error: "Something is wrong with your bag. Please refresh and try again." }, 400);
    }
  }

  const supabase = db();

  // ---- settings -------------------------------------------------------------------------
  const { data: settingsRows } = await supabase.from("settings").select("key,value");
  const S: Record<string, any> = {};
  (settingsRows ?? []).forEach((r) => (S[r.key] = r.value));
  const shippingFlat = Number(S.shipping_flat_lkr ?? 450);
  const freeOver = Number(S.free_shipping_over_lkr ?? 10000);
  const allowed = S.payments ?? { cod: true, bank: true, card: true };
  const key = method === "bank_transfer" ? "bank" : method;
  if (allowed[key] === false) return json({ error: "That payment method isn't available right now." }, 400);

  const merchantId = Deno.env.get("PAYHERE_MERCHANT_ID");
  const merchantSecret = Deno.env.get("PAYHERE_MERCHANT_SECRET");
  const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");
  if (method === "card" && (!merchantId || !merchantSecret || !siteUrl)) {
    return json({ error: "Card payments aren't available right now. Please choose another payment method." }, 503);
  }

  // ---- price the cart from the database -------------------------------------------------
  const ids = [...new Set(items.map((i) => i.variant_id))];
  const { data: variants, error: vErr } = await supabase
    .from("variants")
    .select("id,label,price_lkr,stock,active,product:products(id,name,fragrance,active)")
    .in("id", ids);
  if (vErr) { console.error(vErr); return json({ error: "We couldn't check your bag. Please try again." }, 500); }

  const byId = new Map((variants ?? []).map((v: any) => [v.id, v]));
  const lines: { variant_id: string; name: string; label: string; price: number; qty: number }[] = [];
  const want = new Map<string, number>();
  items.forEach((i) => want.set(i.variant_id, (want.get(i.variant_id) ?? 0) + i.qty));
  for (const [id, qty] of want) {
    const v: any = byId.get(id);
    if (!v || !v.active || !v.product?.active) return json({ error: "One of the items in your bag is no longer available. Please refresh your bag." }, 409);
    if (v.stock !== null && v.stock < qty) return json({ error: `Sorry, we only have ${v.stock} of ${v.product.name} (${v.label}) in stock.` }, 409);
    const frag = String(v.product.fragrance).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    lines.push({ variant_id: id, name: `${v.product.name} — ${frag}`, label: v.label, price: v.price_lkr, qty });
  }
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const shipping = subtotal >= freeOver ? 0 : shippingFlat;
  const total = subtotal + shipping;

  // ---- basic abuse guard: max 5 orders per phone per hour -------------------------------
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("phone", phone).gte("created_at", since);
  if ((count ?? 0) >= 5) return json({ error: "Too many orders from this number just now. Please contact us to complete your order." }, 429);

  // ---- create the order -----------------------------------------------------------------
  const { data: order, error: oErr } = await supabase.from("orders").insert({
    payment_method: method,
    payment_status: method === "bank_transfer" ? "awaiting_slip" : "pending",
    customer_name: name, phone, email: email || null,
    address, city, district, postal_code: postal || null, notes: notes || null,
    subtotal_lkr: subtotal, shipping_lkr: shipping, total_lkr: total,
  }).select("id,order_no,access_token").single();
  if (oErr || !order) { console.error(oErr); return json({ error: "We couldn't place your order. Please try again." }, 500); }

  const { error: iErr } = await supabase.from("order_items").insert(lines.map((l) => ({
    order_id: order.id, variant_id: l.variant_id, name: l.name, variant_label: l.label, unit_price_lkr: l.price, qty: l.qty,
  })));
  if (iErr) {
    console.error(iErr);
    await supabase.from("orders").delete().eq("id", order.id);
    return json({ error: "We couldn't place your order. Please try again." }, 500);
  }
  for (const l of lines) await supabase.rpc("decrement_stock", { p_variant: l.variant_id, p_qty: l.qty });

  // ---- tell the owner ---------------------------------------------------------------------
  const methodLabel = { cod: "Cash on delivery", bank_transfer: "Bank transfer", card: "Card (PayHere)" }[method];
  await notifyOwner(
    `New order ${order.order_no} — ${money(total)} (${methodLabel})`,
    `<h2>New order ${esc(order.order_no)}</h2>` +
    `<p><b>${esc(name)}</b> · ${esc(phone)}${email ? " · " + esc(email) : ""}<br>${esc(address)}, ${esc(city)}, ${esc(district)}${postal ? " " + esc(postal) : ""}</p>` +
    `<ul>${lines.map((l) => `<li>${esc(l.name)} (${esc(l.label)}) × ${l.qty} — ${money(l.price * l.qty)}</li>`).join("")}</ul>` +
    `<p>Subtotal ${money(subtotal)} · Delivery ${money(shipping)} · <b>Total ${money(total)}</b></p>` +
    `<p>Payment: <b>${methodLabel}</b>${method === "card" ? " (awaiting confirmation from PayHere)" : ""}${method === "bank_transfer" ? " (awaiting slip)" : ""}</p>` +
    (notes ? `<p>Notes: ${esc(notes)}</p>` : ""),
  );

  const result: Record<string, unknown> = { order_no: order.order_no, token: order.access_token, total };

  // ---- card: sign the PayHere checkout form ------------------------------------------------
  if (method === "card") {
    const amount = total.toFixed(2);
    const sandbox = (Deno.env.get("PAYHERE_SANDBOX") ?? "true") !== "false";
    const parts = name.split(/\s+/);
    result.payhere = {
      action: sandbox ? "https://sandbox.payhere.lk/pay/checkout" : "https://www.payhere.lk/pay/checkout",
      fields: {
        merchant_id: merchantId,
        return_url: `${siteUrl}/order.html?no=${order.order_no}&t=${order.access_token}&new=1&ret=1`,
        cancel_url: `${siteUrl}/checkout.html?cancelled=1`,
        notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payhere-notify`,
        order_id: order.order_no,
        items: `Audrey Care order ${order.order_no}`,
        currency: "LKR",
        amount,
        first_name: parts[0],
        last_name: parts.slice(1).join(" ") || "-",
        email, phone, address, city, country: "Sri Lanka",
        hash: md5Upper(`${merchantId}${order.order_no}${amount}LKR${md5Upper(merchantSecret!)}`),
      },
    };
  }
  return json(result);
});
