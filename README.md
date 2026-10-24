# Audrey Care — online shop

A fast, premium online shop for Audrey Care: retail checkout (cash on delivery, bank transfer, card via
PayHere) plus a bulk-order enquiry page for hotels and spas. It is a **separate project** from the
operations app. It has its own repo, its own domain and its own Supabase database.

There is no build step. The site is plain HTML, CSS and JavaScript, so any static host can serve it.

```
index.html  shop.html  product.html  checkout.html  order.html
bulk.html   about.html  contact.html  policies.html  404.html
advice.html (tips list + articles)   quiz.html (find-your-fragrance quiz)
admin.html               YOUR DASHBOARD: orders, products, pages, photos, colours, settings, messages
css/styles.css           design system (colours, type, animation)
js/config.js             ← your settings (Supabase keys, contact details, bank details)
js/content.js            applies what you change in the dashboard (texts, photos, colours) to every page
js/editor.js             the click-to-edit mode on the pages (opened from the dashboard)
js/cms-store.js          sign-in, saving and photo uploads for the dashboard
js/pages/admin.js        the dashboard itself
js/data.js               sample catalogue + advice articles (placeholder content)
js/art.js                generated placeholder product artwork
js/layout.js             header, mega menu and footer (edit navigation here)
js/app.js                cart, search, drawer, API calls
js/pages/*.js            one small script per page
supabase/schema.sql      database tables + security rules
supabase/seed.sql        sample products (generated from js/data.js)
supabase/functions/      the 3 server functions (place-order, submit-form, payhere-notify)
```

## Edit the site yourself (no coding needed)

Open **`yourwebsite/admin.html`** (for the preview: `http://localhost:8000/admin.html`). This is your private
dashboard. Sign in with the owner account you create in step 2 → A (step 5) (until then it runs in **demo mode** so you can
try everything; demo changes only exist in your own browser).

| I want to… | Go to |
|---|---|
| **Change any wording** on any page, down to a button label or a footer line | **Edit pages** → pick the page → *click the text and type*. Press Enter to save. |
| **Replace any picture** (hero slides, banner, tiles, story page) or the **logo** | **Edit pages**: click the picture. Or **Photos & logo** to see every picture slot in one place. |
| **Add or change products**, sizes, prices, “was” prices, stock, photos, labels (New / Bestseller) | **Products** (turn a product off to hide it; ▲▼ changes the order) |
| **Change colours for the whole shop** (main colour, accent, text, soft backgrounds) | **Colours** |
| **Colour one button, heading or box** (text colour and background) | **Edit pages** → click it → the small colour panel appears. **↑ Bigger** selects the box around it. Header and footer colours apply on every page; other colours only on that page. |
| **Phone, WhatsApp, email, address**, delivery charge, free-delivery amount, which payment methods to offer, **bank details** | **Settings** |
| **See and manage orders**: mark confirmed / packed / dispatched, add courier + tracking number (customers see it), open bank-transfer slips, message the customer on WhatsApp, download a CSV | **Orders** |
| **Read bulk enquiries, contact messages and newsletter sign-ups**; mark done; download a CSV | **Messages** |
| **Undo** a wording change | **Edit pages** → “Texts you have changed” → *Back to original* |

Good to know:

- Changing a wording changes it **everywhere that exact wording appears** (e.g. a button used on several pages).
- Put `*stars*` around words to make them the soft italic accent (in the dashboard list), or use the **Accent** button while editing on the page.
- Product names, prices and descriptions are edited under **Products**, not on the page (and have no colour panel).
- Pictures are shrunk automatically before upload, so the shop stays fast.
- Not editable from the dashboard (ask a developer): the list of product **types** and **fragrances**, page titles
  shown in the browser tab, hidden labels for screen readers, and short pop-up messages (like form errors).

**Advanced / fallback:** the original wording and pictures still live in the files (`index.html`, `js/config.js`,
`js/data.js`, …). Whatever you set in the dashboard is applied on top of them, so you can always return to the originals.

## 1. Preview it on your computer (2 minutes)

```
python3 -m http.server 8000
```

Open http://localhost:8000. Until Supabase is connected the shop runs in **demo mode**: everything works,
but orders and enquiries are only saved in your own browser (a yellow banner says so at checkout).

> Opening `index.html` by double-clicking also works, but browsers block custom fonts from `file://`, so
> it will look slightly different. Use the command above for a faithful preview.

## 2. Go live: checklist

### A. Create the database (Supabase)

1. Create a **new** Supabase project at https://supabase.com (not your operations one).
2. Dashboard → **SQL Editor** → New query → paste all of `supabase/schema.sql` → **Run**.
3. New query → paste `supabase/seed.sql` → **Run** (loads the sample products).
4. Dashboard → **Project Settings → API**. Copy the **Project URL** and the **anon / publishable key**
   into `js/config.js` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`). The anon key is *meant* to be public. The
   security rules in `schema.sql` mean the website can only read the catalogue.
5. **Create your owner account** (this is how you sign in to `admin.html`):
   - Dashboard → **Authentication → Users → Add user → Create new user**. Enter your email and a strong password,
     and tick **Auto Confirm User**.
   - Dashboard → **Authentication → Sign In / Providers** (or *Providers → Email*): switch **off** “Allow new users to
     sign up”, so nobody else can create an account.
   - Dashboard → **SQL Editor** → New query → run this once (use your email):
     ```sql
     insert into public.admins (id) select id from auth.users where email = 'you@yourdomain.lk';
     ```
   Only accounts listed in `public.admins` can change anything; the database enforces this, not the web page.
   To add a second person later, create their user and run the same line with their email.
6. Open `https://yourwebsite/admin.html`, sign in, and look at **Overview → Getting started**.

### B. Deploy the server functions

These calculate prices on the server (so nobody can tamper with a price in their browser), create orders,
sign card payments and email you.

```
npm i -g supabase            # or see https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref YOUR_PROJECT_REF

supabase secrets set SITE_URL=https://your-shop-domain.lk
supabase secrets set ALLOWED_ORIGIN=https://your-shop-domain.lk

supabase functions deploy place-order submit-form payhere-notify --no-verify-jwt
```

`SITE_URL` and `ALLOWED_ORIGIN` must be the exact address customers see in the browser (including `https://`,
no trailing slash). If you serve the shop on both `www` and the bare domain, skip `ALLOWED_ORIGIN`.

**Email alerts when an order or enquiry arrives (recommended, free tier is fine):**
create an account at https://resend.com, make an API key, then

```
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set OWNER_EMAIL=you@yourdomain.lk          # comma-separate for several people
supabase secrets set RESEND_FROM="Audrey Care Shop <orders@yourdomain.lk>"   # needs a domain verified in Resend
```

Without these the shop still works. You'd just have to check the Supabase tables for new orders.

### C. Card payments (PayHere)

1. Register as a merchant at https://www.payhere.lk. Test first in the **sandbox** at https://sandbox.payhere.lk.
2. In PayHere → *Integrations / Domains & Credentials*, add your shop domain and note the **Merchant ID**
   and **Merchant Secret**.
3. Set them as secrets:
   ```
   supabase secrets set PAYHERE_MERCHANT_ID=1234567
   supabase secrets set PAYHERE_MERCHANT_SECRET=your_secret
   supabase secrets set PAYHERE_SANDBOX=true      # change to false when PayHere approves your live account
   ```
4. Place a test order with a PayHere sandbox card (their docs list test card numbers). After paying, the order
   page should flip to **Payment received** within a few seconds, and the order's `payment_status` becomes `paid`.
5. PayHere reviews your site before going live. They look for delivery, refund and privacy pages (in
   `policies.html`) and your contact details. Set `PAYHERE_SANDBOX=false` and swap in your live ID and secret.

Don't want card payments yet? In Supabase → Table editor → `settings` → `payments`, set `"card": false`. The
option disappears from checkout.

### D. Put the site online

Any static host works. **Cloudflare Pages**, **Netlify** and **Vercel** are free, support private repos and
need no build step. Connect the GitHub repo, leave the build command empty, and set the publish directory
to the repo root (`/`). Then add your custom domain in the host's settings and make sure the `SITE_URL` and
`ALLOWED_ORIGIN` secrets from step B match it.

(GitHub Pages only serves *private* repos on a paid plan.)

### E. Make it yours

Everything here is done in the dashboard (`admin.html`):

- **Logo and photos:** *Photos & logo*, or click a picture in *Edit pages*.
- **Contact details, delivery fee, free-delivery amount, payment methods, bank details:** *Settings*.
- **Real products and photos:** *Products* (replace or delete the 12 placeholder products).
- **Wording:** *Edit pages*. Replace the placeholder “Our story” and review every page's wording.
- **Policies:** `policies.html` is a **draft**. Open it in *Edit pages* and rewrite it (ideally with a lawyer) to match how
  you really operate.

### F. Final checks before announcing

- [ ] Placed a test order of each type (COD, bank transfer + slip, card in sandbox).
- [ ] Received the owner email for each.
- [ ] Real products, prices and photos in place; placeholder products removed.
- [ ] Contact details, bank details and policies filled in and reviewed.
- [ ] `PAYHERE_SANDBOX=false` with live credentials (only after PayHere approves you).

## 3. Running the shop day to day

Open `admin.html`. The **Overview** shows what needs attention (new orders, bank slips to check, messages).

| I want to… | Where |
|---|---|
| See new orders | **Orders** (newest first; the number on the menu counts new ones) |
| Confirm a bank transfer | **Orders** → open the order → **Open payment slip** → set *Payment* to **Paid** and *Order progress* to **Confirmed** → Save |
| Mark packed / dispatched / delivered | **Orders** → open the order → change *Order progress* → Save. The customer's order page updates its progress bar |
| Show a tracking number to the customer | **Orders** → fill *Courier* and *Tracking number* → Save |
| Tell the customer what happened | **Orders** → open the order → **Message on WhatsApp** (the text is written for you) |
| Cancel an order | *Order progress* → **Cancelled** |
| Read bulk enquiries, messages, sign-ups | **Messages** (mark each *done* as you go) |
| Hide a product / mark a size out of stock | **Products** → switch it off, or set that size's *Stock* to 0 (leave empty to not track stock) |
| Change a price | **Products** → Edit → *Sizes & prices* |

Customers can follow their order at **Track my order** with their order number and mobile number. The
private link shown after checkout also lets them upload a bank slip.

> The Supabase dashboard (**Table editor**) still shows the same data if you ever want to look at it directly.

### Adding your real products

Use **Products → + Add a product** in the dashboard: name, fragrance, type, short line, description, how to use,
photos (the first one is the main picture; a portrait 4:5 photo on a plain background works best) and one row per
size with its price. To start from scratch, delete or hide the 12 placeholder products.

A few developer-level notes:

- `js/data.js` holds the *placeholder* catalogue, the lists of product **types** and **fragrances** used by menus and
  filters, and the advice articles. It is also the fallback if the database is unreachable. To add a brand-new
  fragrance or product type, add it there first (fragrances need a colour), then pick it in the dashboard.
- To reload the database from `js/data.js`, run `node scripts/make-seed.mjs` and run the resulting
  `supabase/seed.sql` (this overwrites products with the same `id`).

## 4. Changing the look

The design follows the structure and motion of a premium beauty storefront: a fixed 1120px column, a
static two-tier header, a click-to-open mega menu, flat square buttons that invert on hover, and almost no
animation (no scroll effects, no hover zoom; the hero swaps slides instantly and doesn't autoplay).

- **Colours:** the dashboard's **Colours** page (main colour, accent, text, soft background). Developers can also edit
  the `:root` block at the top of `css/styles.css`; `--brand` (deep green) is the main colour, `--gold` the accent.
- **Fonts:** Figtree (text, a close stand-in for the reference's paid typeface) and Fraunces (italic accents),
  both self-hosted in `assets/fonts/` (SIL Open Font License).
- **Hero slides:** click the wording or the picture in the dashboard's *Edit pages* (landscape, about 1000×800; the
  curved edge is applied automatically). The built-in artwork lives in `js/art.js`.
- **Menu and footer:** wording can be edited in *Edit pages* (use the **Menu** button in the editor bar to open the menu);
  links and structure are in `js/layout.js`.
- **Advice articles and quiz:** articles live in `js/data.js` (`articles`); the quiz is `js/pages/quiz.js`.
  The article text is **draft copy**: review and replace it.

## 5. How it's protected

- Prices are always recalculated on the server from the database; the browser only sends product IDs and quantities.
- The website's key can only **read** products and settings. Orders, customer details and enquiries cannot be read by
  the public (tested against the real schema).
- Order lookups need either the private link token or the order number + mobile number, and the latter reveals no address.
- Bank slips go into a **private** bucket the website can upload to but never read; 5 MB limit, images/PDF only.
- Card details never touch this site. They are entered on PayHere, and payment confirmations are accepted only after
  verifying PayHere's signature and the amount.
- Forms have a hidden spam trap, and orders are limited to 5 per phone number per hour.
- **The dashboard is protected by the database, not by the web page.** Every change is checked against the
  `public.admins` list on the server. The public key can only read; a signed-in account that is not on the list can
  change nothing (tested against the real schema). The sign-in page itself is public but only works for your account;
  keep sign-ups switched off (step 2 → A → 5) and use a strong password.
- Pictures you upload go into a public bucket (`site-images`) that only owners can write to; bank slips stay in a
  private bucket that only owners can read.
- Wording you save is filtered so only simple formatting (italics, bold, line breaks, safe links) can be stored.

## 6. Not built yet (ideas for later)

- Editing the lists of product **types**, **fragrances** and categories from the dashboard (they live in `js/data.js`).
- Editing page titles for search engines, picture descriptions (alt text) and short pop-up messages.
- Confirmation emails or SMS *to customers* (you receive the alerts; send.lk SMS could be added the same way as in your operations app).
- Multiple owner roles (everyone on the `admins` list can do everything).
- Customer accounts and wholesale price lists (bulk is enquiry-only for now).
- Courier integration (CityPak waybills and live tracking).
- Discount codes, product reviews, wishlists.
