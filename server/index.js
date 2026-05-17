"use strict";

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const Stripe = require("stripe");

const PORT = process.env.PORT || 4242;
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const successUrl =
  process.env.SUCCESS_URL || "http://localhost:8000/cart.html?success=1";
const cancelUrl = process.env.CANCEL_URL || "http://localhost:8000/cart.html";

if (!stripeSecret) {
  console.error("Missing STRIPE_SECRET_KEY in environment.");
  process.exit(1);
}

const stripe = new Stripe(stripeSecret);

const productsPath = path.join(__dirname, "..", "data", "products.json");
let allowedPriceIds = new Set();

function loadCatalog() {
  const raw = fs.readFileSync(productsPath, "utf8");
  const catalog = JSON.parse(raw);
  const ids = new Set();
  for (const product of catalog.products || []) {
    for (const variant of product.variants || []) {
      if (variant.stripePriceId && !String(variant.stripePriceId).includes("REPLACE")) {
        ids.add(variant.stripePriceId);
      }
    }
  }
  allowedPriceIds = ids;
  return catalog;
}

loadCatalog();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:8000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.use(express.json({ limit: "32kb" }));
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.get("/health", function (_req, res) {
  res.json({ ok: true, prices: allowedPriceIds.size });
});

app.post("/create-checkout-session", async function (req, res) {
  try {
    const items = req.body && req.body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Basket is empty." });
    }

    const lineItems = [];
    for (const row of items) {
      const priceId = row && row.priceId;
      const quantity = parseInt(row && row.quantity, 10);
      if (!priceId || !allowedPriceIds.has(priceId)) {
        return res.status(400).json({ error: "Invalid item in basket." });
      }
      if (!quantity || quantity < 1 || quantity > 99) {
        return res.status(400).json({ error: "Invalid quantity." });
      }
      lineItems.push({ price: priceId, quantity });
    }

    const sessionParams = {
      mode: "payment",
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      shipping_address_collection: {
        allowed_countries: (process.env.SHIPPING_COUNTRIES || "GB")
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      },
    };
    if (process.env.STRIPE_AUTOMATIC_TAX === "true") {
      sessionParams.automatic_tax = { enabled: true };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Checkout failed." });
  }
});

app.listen(PORT, function () {
  console.log("Buddy Buddha checkout API on port " + PORT);
  console.log("Allowed origins: " + allowedOrigins.join(", "));
  console.log("Allowed Stripe prices loaded: " + allowedPriceIds.size);
});
