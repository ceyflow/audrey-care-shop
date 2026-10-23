# Audrey Care — online shop

A fast, premium online shop for Audrey Care: retail checkout (cash on delivery, bank transfer, card via
PayHere) plus a bulk-order enquiry page for hotels and spas. It is a **separate project** from the
operations app. It has its own repo, its own domain and its own Supabase database.

There is no build step. The site is plain HTML, CSS and JavaScript, so any static host can serve it.

```
index.html  shop.html  product.html  checkout.html  order.html
bulk.html   about.html  contact.html  policies.html  404.html
advice.html (tips list + articles)   quiz.html (find-your-fragrance quiz)
css/styles.css           design system (colours, type, animation)
js/config.js             ← your settings (Supabase keys, contact details, bank details)
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

Everything is a plain file in this repo. To change something: open the file on GitHub, click the pencil
icon (✏), edit, then **Commit changes**. The live site updates about a minute later.

| To change… | Edit this file |
|---|---|
| **Logo** | upload the image into the `assets` folder, then put its path in `LOGO` in `js/config.js` |
| **Photos** (hero slides, banner, tiles, pictures on the home and story pages) | upload into `assets`, then fill the `IMAGES` list in `js/config.js` |
| **Products**: names, prices, descriptions, product photos | `js/data.js` |
| **Words on the home page** (hero slides, banner, sections) | `index.html` |
| **Words on other pages** | `about.html`, `bulk.html`, `contact.html`, `policies.html` |
| **Advice articles** | `js/data.js`, under `articles` |
| **Phone, WhatsApp, email, address, delivery fee, bank details** | `js/config.js` |
| **Colours** | the top of `css/styles.css` (`--brand` is the main green) |
| **Menu and footer links** | `js/layout.js` |

**Uploading a picture:** open the `assets` folder in the repo, click **Add file → Upload files**, drag the picture in,
then **Commit changes**. Use short names without spaces (`hero-1.jpg`). Then put the path in `js/config.js`,
for example `hero1: 'assets/hero-1.jpg'`.

**Picture sizes that fit best** (width × height; JPG or WebP; keep each under about 300 KB):
hero slides 1000 × 800 · banner 1600 × 640 · bulk block 900 × 600 · home split picture 640 × 640 ·
story page picture 520 × 650 · category tiles 340 × 220 · logo: transparent PNG or SVG at least 200 px tall.

**Product photos:** one square picture per product (800 × 800, product centred on white). Upload to
`assets/products/`, then in `js/data.js` set `images: ['assets/products/shampoo-lavender.jpg']` on that product.

**Orders and customers** are not edited in these files. They live in the database once Supabase is connected
(section 2 below), where you manage them in the Supabase dashboard.

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

- **Contact details:** fill in `js/config.js`: `PHONE`, `EMAIL`, `ADDRESS`, `WHATSAPP_NUMBER`
  (digits only, e.g. `94771234567`). Anything left empty is hidden. The WhatsApp chat bubble only appears if a
  number is set.
- **Bank details for transfers:** Supabase → `settings` → `bank` → edit the JSON
  (`{"bank": "...", "account_name": "...", "account_no": "...", "branch": "..."}`).
- **Delivery fee / free-delivery threshold:** `settings` → `shipping_flat_lkr` and `free_shipping_over_lkr`.
- **Real products and photos:** see below.
- **Copy:** replace the placeholder "Our story" (`about.html`) and review all wording.
- **Policies:** `policies.html` is a **draft**. Review it (ideally with a lawyer) and edit to match how you
  really operate.

### F. Final checks before announcing

- [ ] Placed a test order of each type (COD, bank transfer + slip, card in sandbox).
- [ ] Received the owner email for each.
- [ ] Real products, prices and photos in place; placeholder products removed.
- [ ] Contact details, bank details and policies filled in and reviewed.
- [ ] `PAYHERE_SANDBOX=false` with live credentials (only after PayHere approves you).

## 3. Running the shop day to day

Everything is in the Supabase dashboard → **Table editor**.

| I want to… | Where |
|---|---|
| See new orders | `orders` (newest first) + `order_items` |
| Confirm a bank transfer | open the slip in **Storage → payment-slips → AC-1001/**, then set the order's `payment_status` to `paid` and `status` to `confirmed` |
| Mark packed / dispatched / delivered | change `status` on the order. The customer's order page updates its progress bar |
| Show a tracking number to the customer | fill `courier` and `tracking_no` on the order |
| Cancel an order | set `status` to `cancelled` |
| Read bulk enquiries, messages, newsletter sign-ups | `form_submissions` (tick `handled` as you go) |
| Hide a product / mark out of stock | set `active` to false on the product or variant, or set the variant's `stock` to 0 (leave `stock` empty to not track it) |
| Change a price | `variants.price_lkr` |

Customers can follow their order at **Track my order** with their order number and mobile number. The
private link shown after checkout also lets them upload a bank slip.

### Adding your real products

1. **Photos:** put them in `assets/products/` (for example `shampoo-lavender.jpg`, 4:5 portrait works best).
2. **Database:** in `products`, set `images` to `{assets/products/shampoo-lavender.jpg,assets/products/shampoo-lavender-2.jpg}`
   and edit `name`, `tagline`, `description`, `how_to_use`. Add rows in `variants` for sizes and prices.
3. **Offline copy:** keep `js/data.js` in step. It is the fallback if the database is unreachable and it defines the list of
   product types and fragrances used by menus and filters. To add a **new fragrance or product type**, add it there
   first (with a colour for fragrances), then use its `id` in the database.
4. To reload the database from `js/data.js`, run `node scripts/make-seed.mjs` and run the resulting
   `supabase/seed.sql`. This overwrites products with the same `id`.

## 4. Changing the look

The design follows the structure and motion of a premium beauty storefront: a fixed 1120px column, a
static two-tier header, a click-to-open mega menu, flat square buttons that invert on hover, and almost no
animation (no scroll effects, no hover zoom; the hero swaps slides instantly and doesn't autoplay).

- **Colours:** the `:root` block at the top of `css/styles.css`. `--brand` (deep green) is the main colour,
  `--gold` is the accent under the open menu item.
- **Fonts:** Figtree (text, a close stand-in for the reference's paid typeface) and Fraunces (italic accents),
  both self-hosted in `assets/fonts/` (SIL Open Font License).
- **Hero slides:** text in `index.html`; artwork in `js/art.js`. For real photography, replace the `data-art`
  blocks with `<div class="art-clip"><img src="assets/hero-1.jpg" alt="" style="width:100%;height:100%;object-fit:cover"></div>`
  (landscape, about 1000×800; the curved edge is applied automatically).
- **Menu and footer:** `js/layout.js`.
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

## 6. Not built yet (ideas for later)

- An admin screen for orders (today you use the Supabase table editor).
- Confirmation emails or SMS *to customers* (you receive the alerts; send.lk SMS could be added the same way as in your operations app).
- Customer accounts and wholesale price lists (bulk is enquiry-only for now).
- Courier integration (CityPak waybills and live tracking).
- Discount codes, product reviews, wishlists.
