/*
 * Site configuration. Fill these in before going live — see README.md.
 * Anything left empty is simply hidden from the site.
 */
window.AC_CONFIG = {
  SITE_NAME: 'Audrey Care',

  /* YOUR LOGO. Upload the file to the "assets" folder, then put its path here, e.g. 'assets/logo.png'.
     Empty = the built-in leaf + "Audrey Care" wordmark. A transparent PNG or SVG, at least 200px tall, works best. */
  LOGO: '',

  /* YOUR PHOTOS. Upload to the "assets" folder, then put each path between the quotes, e.g. 'assets/hero-1.jpg'.
     Empty = the built-in illustration for that spot. Sizes that fit best (width x height, JPG/WebP, under 300 KB):
       hero1 / hero2 / hero3 : 1000 x 800   (the three hero slides on the home page)
       banner                : 1600 x 640   (wide banner with text on the right)
       band                  : 900 x 600    (green "bulk orders" block)
       split                 : 640 x 640    (square picture next to "Care that's kind...")
       about                 : 520 x 650    (portrait picture on the Our story page)
       tiles                 : 340 x 220    (small category pictures) */
  IMAGES: {
    hero1: '', hero2: '', hero3: '',
    banner: '', band: '', split: '', about: '',
    tiles: { all: '', hair: '', body: '', hands: '', home: '', bulk: '' }
  },

  /* Supabase (a NEW project for this shop — not your operations one).
     Leave both empty to run in demo mode: the shop works, but orders and enquiries are
     only saved in the visitor's own browser. */
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  /* Contact details shown in the footer, contact page and chat button. */
  WHATSAPP_NUMBER: '',     // international format, digits only, e.g. 94771234567
  PHONE: '',               // e.g. '+94 77 123 4567'
  EMAIL: '',               // e.g. 'hello@yourdomain.lk'
  ADDRESS: '',             // e.g. 'No. 1, Example Road, Colombo'

  /* Delivery. These are defaults; if Supabase is connected, the `settings` table wins. */
  SHIPPING_FLAT_LKR: 450,
  FREE_SHIPPING_OVER_LKR: 10000,

  /* Payment methods offered at checkout. */
  PAYMENTS: { cod: true, bank: true, card: true },

  /* Bank details shown to customers who choose bank transfer. */
  BANK: {
    bank: '',
    account_name: '',
    account_no: '',
    branch: ''
  }
};
