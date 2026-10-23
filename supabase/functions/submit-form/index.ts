// submit-form: stores bulk enquiries, contact messages and newsletter sign-ups, and emails the owner.
import { clip, cors, db, esc, json, notifyOwner } from "../_shared/util.ts";

const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  if (b?.company) return json({ ok: true }); // honeypot: pretend success, store nothing

  const type = b?.type;
  let data: Record<string, unknown>;
  let subject = "";

  if (type === "newsletter") {
    const email = clip(b.email, 200);
    if (!emailOk(email)) return json({ error: "Please enter a valid email address." }, 400);
    data = { email };
  } else if (type === "contact") {
    data = { name: clip(b.name, 120), phone: clip(b.phone, 20), email: clip(b.email, 200), message: clip(b.message, 3000) };
    if (!data.name || !emailOk(String(data.email)) || !data.message) return json({ error: "Please fill in your name, email and message." }, 400);
    subject = `Message from ${data.name}`;
  } else if (type === "bulk") {
    data = {
      business: clip(b.business, 160), contact: clip(b.contact, 120), btype: clip(b.btype, 40), phone: clip(b.phone, 20),
      email: clip(b.email, 200), products: Array.isArray(b.products) ? b.products.slice(0, 12).map((x: unknown) => clip(x, 40)) : [],
      size: clip(b.size, 60), quantity: clip(b.quantity, 120), message: clip(b.message, 3000),
    };
    if (!data.business || !data.contact || !/^0\d{9}$/.test(String(data.phone)) || !emailOk(String(data.email))) {
      return json({ error: "Please fill in your business name, contact person, mobile number and email." }, 400);
    }
    subject = `Bulk enquiry — ${data.business}`;
  } else {
    return json({ error: "Unknown form" }, 400);
  }

  const { error } = await db().from("form_submissions").insert({ type, data });
  if (error) { console.error(error); return json({ error: "We couldn't send that. Please try again." }, 500); }

  if (subject) {
    const rows = Object.entries(data).filter(([, v]) => v && (!Array.isArray(v) || v.length))
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${esc(k)}</td><td>${esc(Array.isArray(v) ? v.join(", ") : v)}</td></tr>`).join("");
    await notifyOwner(subject, `<h2>${esc(subject)}</h2><table>${rows}</table>`);
  }
  return json({ ok: true });
});
