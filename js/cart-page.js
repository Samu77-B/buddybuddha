(function () {
  if (!window.BB_SHOP || !window.BB_SHOP.enabled) return;

  var currency = "gbp";

  function formatMoney(cents) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(cents / 100);
    } catch (e) {
      return "£" + (cents / 100).toFixed(2);
    }
  }

  function getApiBase() {
    if (window.BB_CHECKOUT && window.BB_CHECKOUT.apiBase) {
      return String(window.BB_CHECKOUT.apiBase).replace(/\/$/, "");
    }
    return "";
  }

  function render() {
    var list = document.getElementById("cart-lines");
    var empty = document.getElementById("cart-empty");
    var summary = document.getElementById("cart-summary");
    var subtotalEl = document.getElementById("cart-subtotal");
    if (!list || typeof BBCart === "undefined") return;

    var items = BBCart.getItems();
    list.innerHTML = "";

    if (items.length === 0) {
      if (empty) empty.hidden = false;
      if (summary) summary.hidden = true;
      return;
    }

    if (empty) empty.hidden = true;
    if (summary) summary.hidden = false;

    items.forEach(function (row) {
      var li = document.createElement("li");
      li.className = "cart-line";

      var thumb = document.createElement("div");
      thumb.className = "cart-line__thumb";
      if (row.image) {
        var img = document.createElement("img");
        img.src = row.image;
        img.alt = "";
        thumb.appendChild(img);
      }

      var meta = document.createElement("div");
      meta.className = "cart-line__meta";
      meta.innerHTML =
        "<strong>" +
        row.name +
        "</strong><br><span class=\"cart-line__size\">Size " +
        row.sizeLabel +
        "</span>";

      var qty = document.createElement("div");
      qty.className = "cart-line__qty";
      var minus = document.createElement("button");
      minus.type = "button";
      minus.className = "cart-line__qty-btn";
      minus.textContent = "−";
      minus.setAttribute("aria-label", "Decrease quantity");
      var count = document.createElement("span");
      count.className = "cart-line__qty-val";
      count.textContent = String(row.quantity);
      var plus = document.createElement("button");
      plus.type = "button";
      plus.className = "cart-line__qty-btn";
      plus.textContent = "+";
      plus.setAttribute("aria-label", "Increase quantity");

      minus.addEventListener("click", function () {
        BBCart.setQuantity(row.productId, row.size, row.quantity - 1);
      });
      plus.addEventListener("click", function () {
        BBCart.setQuantity(row.productId, row.size, row.quantity + 1);
      });

      qty.appendChild(minus);
      qty.appendChild(count);
      qty.appendChild(plus);

      var lineTotal = document.createElement("p");
      lineTotal.className = "cart-line__total";
      lineTotal.textContent = formatMoney(row.unitAmount * row.quantity);

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "cart-line__remove";
      remove.textContent = "Remove";
      remove.addEventListener("click", function () {
        BBCart.remove(row.productId, row.size);
      });

      li.appendChild(thumb);
      li.appendChild(meta);
      li.appendChild(qty);
      li.appendChild(lineTotal);
      li.appendChild(remove);
      list.appendChild(li);
    });

    if (subtotalEl) {
      subtotalEl.textContent = formatMoney(BBCart.getSubtotal());
    }
  }

  function setCheckoutMessage(text, isError) {
    var el = document.getElementById("cart-checkout-msg");
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("cart-checkout-msg--error", !!isError);
  }

  function checkout() {
    var apiBase = getApiBase();
    var items = BBCart.getItems();
    if (items.length === 0) {
      setCheckoutMessage("Your basket is empty.", true);
      return;
    }
    if (!apiBase) {
      setCheckoutMessage(
        "Checkout is not configured yet. Copy js/checkout-config.example.js to js/checkout-config.js and set your API URL.",
        true
      );
      return;
    }

    var btn = document.getElementById("cart-checkout-btn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Redirecting…";
    }
    setCheckoutMessage("");

    fetch(apiBase + "/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map(function (row) {
          return { priceId: row.priceId, quantity: row.quantity };
        }),
      }),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          if (!res.ok) throw new Error(body.error || "Checkout failed");
          return body;
        });
      })
      .then(function (data) {
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error("No checkout URL returned");
      })
      .catch(function (err) {
        setCheckoutMessage(err.message || "Could not start checkout.", true);
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Checkout with Stripe";
        }
      });
  }

  fetch("data/products.json")
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (data) {
      if (data && data.currency) currency = data.currency;
    })
    .finally(function () {
      render();
    });

  BBCart.onChange(render);
  document.addEventListener("bb-cart-change", render);

  var checkoutBtn = document.getElementById("cart-checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", checkout);
  }

  var params = new URLSearchParams(window.location.search);
  if (params.get("success") === "1") {
    BBCart.clear();
    setCheckoutMessage("Thank you — your order is being processed by Stripe.");
  }
})();
