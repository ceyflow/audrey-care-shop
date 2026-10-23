// Helpers shared by the Edge Functions.
import { createClient } from "npm:@supabase/supabase-js@2";

export const db = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

export const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/** Emails the shop owner. Optional: does nothing unless RESEND_API_KEY and OWNER_EMAIL are set. Never throws. */
export async function notifyOwner(subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("OWNER_EMAIL");
  if (!key || !to) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM") ?? "Audrey Care Shop <onboarding@resend.dev>",
        to: to.split(",").map((s) => s.trim()),
        subject,
        html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("notifyOwner failed", res.status, await res.text());
  } catch (e) {
    console.error("notifyOwner error", e);
  }
}

export const money = (n: number) => "Rs " + Math.round(n).toLocaleString("en-US");
