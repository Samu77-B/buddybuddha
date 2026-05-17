# Buddy Buddha — Stripe checkout API

Small backend that turns the browser basket into a **Stripe Checkout** session. Stripe calculates the final total (including tax if enabled) and processes payment.

## Setup

1. In Stripe Dashboard, create **Products** and **Prices** for each tee size (see `../data/products.json`).
2. Copy real `price_...` IDs into `../data/products.json` (replace `price_REPLACE_*` placeholders).
3. Copy `.env.example` to `.env` and fill in `STRIPE_SECRET_KEY`, URLs, and `ALLOWED_ORIGINS`.
4. Install and run:

```bash
cd server
npm install
npm start
```

5. On the static site, copy `../js/checkout-config.example.js` to `../js/checkout-config.js` and set `apiBase` to this server’s public URL (e.g. Railway).

## Deploy

Host this folder on **Railway**, **Render**, or similar. Set the same environment variables. Use your **live** secret key only in production.

## Security

- The browser only sends `priceId` + `quantity`.
- The server only accepts price IDs listed in `data/products.json`.
- Never put `sk_` keys in the static site repo.
