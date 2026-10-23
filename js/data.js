/*
 * Product catalogue — PLACEHOLDER DATA.
 * Names, prices and descriptions below are samples so the shop looks complete before real
 * products are added. Edit this file (or, once Supabase is connected, the `products` and
 * `variants` tables) with the real catalogue. See README.md → "Adding your real products".
 *
 * Photos: leave `images` empty to use the generated illustration, or list file paths, e.g.
 *   images: ['assets/products/gentle-shampoo-lavender.jpg']
 */
window.AC_DATA = {
  groups: [
    { id: 'hair',  name: 'Hair' },
    { id: 'body',  name: 'Body' },
    { id: 'hands', name: 'Hands' },
    { id: 'home',  name: 'Home' }
  ],

  kinds: [
    { id: 'shampoo',      name: 'Shampoo',      group: 'hair',  type: 'bottle' },
    { id: 'conditioner',  name: 'Conditioner',  group: 'hair',  type: 'bottle' },
    { id: 'shower-gel',   name: 'Shower Gel',   group: 'body',  type: 'pump' },
    { id: 'body-lotion',  name: 'Body Lotion',  group: 'body',  type: 'pump' },
    { id: 'bubble-bath',  name: 'Bubble Bath',  group: 'body',  type: 'bubble' },
    { id: 'hand-wash',    name: 'Hand Wash',    group: 'hands', type: 'pump' },
    { id: 'air-freshener',name: 'Air Freshener',group: 'home',  type: 'spray' }
  ],

  fragrances: [
    { id: 'strawberry',  name: 'Strawberry',  color: '#D9566B', tint: '#FBE4E8', note: 'Sweet and bright' },
    { id: 'lavender',    name: 'Lavender',    color: '#8A74C2', tint: '#ECE6F7', note: 'Calm and soft' },
    { id: 'apple',       name: 'Apple',       color: '#5FA83C', tint: '#E6F3DA', note: 'Crisp and fresh' },
    { id: 'ocean-breeze',name: 'Ocean Breeze',color: '#2F8FAE', tint: '#DDF0F6', note: 'Clean and airy' }
  ],

  products: [
    {
      id: 'shampoo-lavender', kind: 'shampoo', fragrance: 'lavender',
      name: 'Gentle Shampoo', badge: 'Bestseller',
      tagline: 'A soft daily lather for clean, comfortable hair.',
      description: 'A gentle everyday shampoo that cleanses without leaving hair feeling stripped. Soft lather, easy to rinse, with a calming lavender fragrance.',
      how_to_use: 'Massage into wet hair and scalp, then rinse thoroughly. Repeat if needed.',
      images: [],
      variants: [
        { id: 'shampoo-lavender-250', label: '250 ml', price: 1350 },
        { id: 'shampoo-lavender-500', label: '500 ml', price: 2450 }
      ]
    },
    {
      id: 'shampoo-apple', kind: 'shampoo', fragrance: 'apple',
      name: 'Gentle Shampoo',
      tagline: 'A soft daily lather for clean, comfortable hair.',
      description: 'A gentle everyday shampoo that cleanses without leaving hair feeling stripped. Soft lather, easy to rinse, with a crisp apple fragrance.',
      how_to_use: 'Massage into wet hair and scalp, then rinse thoroughly. Repeat if needed.',
      images: [],
      variants: [
        { id: 'shampoo-apple-250', label: '250 ml', price: 1350 },
        { id: 'shampoo-apple-500', label: '500 ml', price: 2450 }
      ]
    },
    {
      id: 'conditioner-strawberry', kind: 'conditioner', fragrance: 'strawberry',
      name: 'Silk Conditioner', badge: 'New',
      tagline: 'Smooth, detangled hair with a sweet finish.',
      description: 'A smoothing conditioner that helps detangle and leaves hair feeling soft and manageable, with a sweet strawberry fragrance.',
      how_to_use: 'After shampooing, apply to mid-lengths and ends. Leave for a minute, then rinse well.',
      images: [],
      variants: [
        { id: 'conditioner-strawberry-250', label: '250 ml', price: 1450 },
        { id: 'conditioner-strawberry-500', label: '500 ml', price: 2650 }
      ]
    },
    {
      id: 'conditioner-ocean-breeze', kind: 'conditioner', fragrance: 'ocean-breeze',
      name: 'Silk Conditioner',
      tagline: 'Smooth, detangled hair with a clean, airy scent.',
      description: 'A smoothing conditioner that helps detangle and leaves hair feeling soft and manageable, with a clean ocean breeze fragrance.',
      how_to_use: 'After shampooing, apply to mid-lengths and ends. Leave for a minute, then rinse well.',
      images: [],
      variants: [
        { id: 'conditioner-ocean-breeze-250', label: '250 ml', price: 1450 },
        { id: 'conditioner-ocean-breeze-500', label: '500 ml', price: 2650 }
      ]
    },
    {
      id: 'shower-gel-ocean-breeze', kind: 'shower-gel', fragrance: 'ocean-breeze',
      name: 'Daily Shower Gel', badge: 'Bestseller',
      tagline: 'Rich, creamy lather that rinses clean.',
      description: 'A creamy shower gel for everyday use. Cleanses gently and leaves skin feeling fresh, with a clean ocean breeze fragrance.',
      how_to_use: 'Work into a lather on wet skin or a sponge, then rinse.',
      images: [],
      variants: [
        { id: 'shower-gel-ocean-breeze-250', label: '250 ml', price: 1250 },
        { id: 'shower-gel-ocean-breeze-500', label: '500 ml', price: 2250 }
      ]
    },
    {
      id: 'shower-gel-apple', kind: 'shower-gel', fragrance: 'apple',
      name: 'Daily Shower Gel',
      tagline: 'Rich, creamy lather that rinses clean.',
      description: 'A creamy shower gel for everyday use. Cleanses gently and leaves skin feeling fresh, with a crisp apple fragrance.',
      how_to_use: 'Work into a lather on wet skin or a sponge, then rinse.',
      images: [],
      variants: [
        { id: 'shower-gel-apple-250', label: '250 ml', price: 1250 },
        { id: 'shower-gel-apple-500', label: '500 ml', price: 2250 }
      ]
    },
    {
      id: 'body-lotion-lavender', kind: 'body-lotion', fragrance: 'lavender',
      name: 'Silk Body Lotion', badge: 'Bestseller',
      tagline: 'Light, quick-absorbing everyday moisture.',
      description: 'A light body lotion that absorbs quickly and leaves skin feeling soft and comfortable all day, with a calming lavender fragrance.',
      how_to_use: 'Smooth over clean, dry skin as often as you like.',
      images: [],
      variants: [
        { id: 'body-lotion-lavender-200', label: '200 ml', price: 1650 },
        { id: 'body-lotion-lavender-400', label: '400 ml', price: 2950 }
      ]
    },
    {
      id: 'body-lotion-strawberry', kind: 'body-lotion', fragrance: 'strawberry',
      name: 'Silk Body Lotion',
      tagline: 'Light, quick-absorbing everyday moisture.',
      description: 'A light body lotion that absorbs quickly and leaves skin feeling soft and comfortable all day, with a sweet strawberry fragrance.',
      how_to_use: 'Smooth over clean, dry skin as often as you like.',
      images: [],
      variants: [
        { id: 'body-lotion-strawberry-200', label: '200 ml', price: 1650 },
        { id: 'body-lotion-strawberry-400', label: '400 ml', price: 2950 }
      ]
    },
    {
      id: 'hand-wash-apple', kind: 'hand-wash', fragrance: 'apple',
      name: 'Soft Hand Wash',
      tagline: 'Gentle enough to use every day.',
      description: 'A mild hand wash that cleans without leaving hands feeling tight, with a crisp apple fragrance. Pump bottle for easy dispensing.',
      how_to_use: 'Pump onto wet hands, lather for 20 seconds, then rinse.',
      images: [],
      variants: [
        { id: 'hand-wash-apple-250', label: '250 ml', price: 750 },
        { id: 'hand-wash-apple-500', label: '500 ml', price: 1350 }
      ]
    },
    {
      id: 'hand-wash-lavender', kind: 'hand-wash', fragrance: 'lavender',
      name: 'Soft Hand Wash', badge: 'New',
      tagline: 'Gentle enough to use every day.',
      description: 'A mild hand wash that cleans without leaving hands feeling tight, with a calming lavender fragrance. Pump bottle for easy dispensing.',
      how_to_use: 'Pump onto wet hands, lather for 20 seconds, then rinse.',
      images: [],
      variants: [
        { id: 'hand-wash-lavender-250', label: '250 ml', price: 750 },
        { id: 'hand-wash-lavender-500', label: '500 ml', price: 1350 }
      ]
    },
    {
      id: 'bubble-bath-strawberry', kind: 'bubble-bath', fragrance: 'strawberry',
      name: 'Bubble Bath',
      tagline: 'Deep, soft bubbles for a slower evening.',
      description: 'A foaming bubble bath for long, relaxing soaks, with a sweet strawberry fragrance.',
      how_to_use: 'Add a capful under running water.',
      images: [],
      variants: [
        { id: 'bubble-bath-strawberry-500', label: '500 ml', price: 1850 }
      ]
    },
    {
      id: 'air-freshener-ocean-breeze', kind: 'air-freshener', fragrance: 'ocean-breeze',
      name: 'Room Air Freshener',
      tagline: 'A clean, airy scent for any room.',
      description: 'A room spray that freshens living spaces in a moment, with a clean ocean breeze fragrance.',
      how_to_use: 'Spray into the air, away from fabrics and polished surfaces.',
      images: [],
      variants: [
        { id: 'air-freshener-ocean-breeze-300', label: '300 ml', price: 1150 }
      ]
    }
  ],

  /* Options on the Bulk orders enquiry form. */
  bulk: {
    sizes: ['5 L can', 'Something else (tell us below)'],
    kinds: ['Shampoo', 'Conditioner', 'Shower Gel', 'Body Lotion', 'Hand Wash', 'Bubble Bath', 'Air Freshener'],
    types: ['Hotel', 'Resort', 'Spa', 'Restaurant', 'Salon', 'Retailer', 'Other']
  }
};
