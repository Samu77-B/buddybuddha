# BuddyBuddha — site + ecommerce notes

## What this repo is

- **Type**: static website (plain HTML/CSS/JavaScript).
- **Pages**:
  - `index.html`: marketing landing page + PWA install prompt wiring.
  - `buddy-buddha-app.html`: the “daily quote app” (quotes are hard-coded in the file).
  - `shop.html`: product grid — add to basket by size.
  - `cart.html`: saved basket (localStorage) → Stripe Checkout via `server/`.
  - `data/products.json`: catalog + Stripe `price_...` IDs (one per size).
  - `server/`: small Node API that creates Stripe Checkout Sessions (deploy separately, e.g. Railway).
- **PWA/offline**:
  - `manifest.webmanifest`: PWA metadata; `start_url` points at `buddy-buddha-app.html`.
  - `sw.js`: service worker that pre-caches a small asset list and serves cache-first.

## Local development / running

This repo is static, so any static file server works.

From the repo folder:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

### Shop + basket + Stripe (local)

1. Static site: `python -m http.server 8000`
2. Checkout API:

```bash
cd server
cp .env.example .env
# Edit .env: STRIPE_SECRET_KEY, SUCCESS_URL, CANCEL_URL, ALLOWED_ORIGINS
npm install
npm start
```

3. `js/checkout-config.js` — set `apiBase` to `http://localhost:4242` (or your deployed API URL).
4. In Stripe Dashboard, create products/prices; paste `price_...` IDs into `data/products.json` (replace `price_REPLACE_*`).

Flow: **Shop → Add to basket → Basket → Checkout with Stripe** (Stripe shows final total, tax/shipping if configured).

### Shop on hold

The live catalog and basket are **turned off** in the UI while Stripe is being set up. Toggle in [`js/shop-config.js`](js/shop-config.js):

```js
window.BB_SHOP = { enabled: false };  // set true when Stripe + products.json are ready
```

Basket/checkout code (`server/`, `js/cart.js`, `data/products.json`) stays in the repo for launch day.

## Hosting (current)

- **Where you said it’s hosted**: Hostinger.
- **What the repo itself declares**: no explicit hosting configuration.
  - No `vercel.json`, `netlify.toml`, `firebase.json`, `CNAME`, or deploy workflows were found.
  - `.gitignore` includes `/.vercel/` which suggests Vercel may have been used at some point, but nothing here enforces that.
- **Git remote**: `origin` points to `https://github.com/Samu77-B/buddybuddha.git`.

### What this means in practice

- You can keep hosting this site almost anywhere (Hostinger, GitHub Pages, Netlify, Vercel, S3, etc.) because it’s just static files.
- The daily quote app is static; **checkout** uses the `server/` API (host on Railway/Render, not Hostinger PHP).

## Ecommerce: options overview

You want to sell merch and asked about:
- keeping the site on Hostinger vs moving to Railway
- using Stripe for ecommerce
- building your own cart

### The simplest approach (lowest engineering)

- **Keep the site on Hostinger**
- Use a hosted ecommerce platform:
  - **Shopify** (most complete for checkout/tax/shipping/admin)
  - **Etsy** (simple, but less branded)
  - Merch/POD platforms (Fourthwall/Spring/etc.)
- Link to the storefront from `shop.html`, or embed “buy” widgets if the platform supports it.

This is typically best when you want to launch quickly with minimal maintenance.

### Stripe as “the ecommerce side” (what it really means)

Stripe is **payments infrastructure**, not a full ecommerce platform.

Stripe can absolutely power merch sales, but you still need solutions for:
- product catalog + pricing source of truth
- inventory (if applicable)
- shipping rates + address collection
- taxes/VAT (depending on where you sell)
- order records + fulfillment workflow
- customer support/refunds policy workflow

## Building your own cart (recommended Stripe pattern)

**Best practice** for a custom cart UX is:

### 1) Custom cart UI on your site

- Product list and cart UI live on your site (could be a new `cart.html` or a richer `shop.html`).
- Cart is stored client-side (e.g., `localStorage`) for a simple static site.

### 2) Server creates a Stripe Checkout Session

- Your site calls a backend endpoint like `POST /checkout`.
- The backend validates the cart and creates a **Stripe Checkout Session** (Stripe-hosted checkout).
- The browser is redirected to Stripe Checkout (or uses embedded Checkout if desired).

### 3) Webhook confirms payment and triggers fulfillment

- Your backend receives Stripe webhooks (e.g. `checkout.session.completed`) to confirm payment.
- Only after webhook confirmation do you fulfill the order (email, POD provider, manual workflow, etc.).

### Why this is the “sweet spot”

- You get a **fully custom cart** experience and still use Stripe’s hardened checkout.
- You avoid handling raw card data and keep compliance scope lower.
- You don’t have to build the hardest parts of checkout UX yourself.

## Where to run the backend for Stripe (Hostinger vs Railway)

### Keep site on Hostinger + add a small backend elsewhere (common)

- **Hostinger** continues serving static pages.
- A small backend runs somewhere that’s good at webhooks and environment variables:
  - Railway / Render / Fly / Cloudflare Workers / etc.
- Your static site calls that backend for checkout + webhook handling.

This is usually the best split for a static marketing site that needs “just enough backend.”

### Move everything to Railway (usually unnecessary for this repo)

Moving the static site to Railway only makes sense if you plan to:
- rebuild as a framework app (e.g. Next.js)
- add accounts, an admin panel, database-backed catalog, etc.

For “small merch,” hosting the static site on Railway doesn’t add much value by itself.

## “Fully custom checkout” (more work than Checkout)

If you want total control over the payment form, you’d use Stripe’s **Payment Element**.

Trade-offs:
- **Pros**: maximum design/flow control.
- **Cons**: you must implement and maintain more checkout logic (validation, totals, taxes/shipping display, edge cases).

For a first merch store, prefer **custom cart + Stripe Checkout Session** unless you have a strong reason not to.

## Suggested next steps (practical)

- Decide product model:
  - small static catalog (hard-code a handful of products)
  - or a real catalog (CMS/database)
- Decide fulfillment:
  - print-on-demand vs shipping your own stock
- Pick ecommerce approach:
  - quickest: Shopify/Etsy
  - custom cart: Stripe Checkout + small backend + webhook fulfillment

