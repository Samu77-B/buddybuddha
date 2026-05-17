(function () {
  if (!window.BB_SHOP || !window.BB_SHOP.enabled) return;

  var catalog = null;
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

  function findVariant(product, size) {
    return (product.variants || []).find(function (v) {
      return v.size === size;
    });
  }

  function renderProducts(products) {
    var grid = document.getElementById("shop-grid");
    if (!grid) return;
    grid.innerHTML = "";

    products.forEach(function (product) {
      var card = document.createElement("article");
      card.className = "shop-card";

      var media = document.createElement("div");
      media.className = "shop-card__media";
      var img = document.createElement("img");
      img.src = product.image;
      img.alt = "";
      img.loading = "lazy";
      media.appendChild(img);

      var body = document.createElement("div");
      body.className = "shop-card__body";

      var title = document.createElement("h3");
      title.textContent = product.name;
      body.appendChild(title);

      var desc = document.createElement("p");
      desc.className = "shop-card__desc";
      desc.textContent = product.description;
      body.appendChild(desc);

      var price = document.createElement("p");
      price.className = "shop-card__price";
      price.textContent = formatMoney(product.unitAmount);
      body.appendChild(price);

      var label = document.createElement("label");
      label.className = "shop-card__size-label";
      label.textContent = "Size";
      body.appendChild(label);

      var select = document.createElement("select");
      select.className = "shop-card__size";
      select.setAttribute("aria-label", "Size for " + product.name);
      (product.variants || []).forEach(function (v) {
        var opt = document.createElement("option");
        opt.value = v.size;
        opt.textContent = v.size;
        select.appendChild(opt);
      });
      body.appendChild(select);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-primary shop-card__add";
      btn.textContent = "Add to basket";
      body.appendChild(btn);

      var feedback = document.createElement("p");
      feedback.className = "shop-card__feedback";
      feedback.setAttribute("role", "status");
      feedback.setAttribute("aria-live", "polite");
      body.appendChild(feedback);

      btn.addEventListener("click", function () {
        var size = select.value;
        var variant = findVariant(product, size);
        if (!variant) return;
        BBCart.add({
          productId: product.id,
          size: variant.size,
          priceId: variant.stripePriceId,
          name: product.name,
          sizeLabel: variant.size,
          unitAmount: product.unitAmount,
          quantity: 1,
          image: product.image,
        });
        feedback.textContent = "Added size " + size + " to your basket.";
        setTimeout(function () {
          feedback.textContent = "";
        }, 2500);
      });

      card.appendChild(media);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  function showSetupNotice() {
    var notice = document.getElementById("shop-stripe-notice");
    if (!notice || !catalog) return;
    var hasPlaceholder = catalog.products.some(function (p) {
      return (p.variants || []).some(function (v) {
        return String(v.stripePriceId).indexOf("price_REPLACE") === 0;
      });
    });
    notice.hidden = !hasPlaceholder;
  }

  fetch("data/products.json")
    .then(function (r) {
      if (!r.ok) throw new Error("catalog");
      return r.json();
    })
    .then(function (data) {
      catalog = data;
      currency = data.currency || "gbp";
      renderProducts(data.products || []);
      showSetupNotice();
    })
    .catch(function () {
      var grid = document.getElementById("shop-grid");
      if (grid) {
        grid.innerHTML = "<p>Could not load products. Please try again later.</p>";
      }
    });
})();
