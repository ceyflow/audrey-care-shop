/*
 * Site configuration. Fill these in before going live — see README.md.
 * Anything left empty is simply hidden from the site.
 */
window.AC_CONFIG = {
  SITE_NAME: 'Audrey Care',

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
