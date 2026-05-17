/**
 * Buddy Buddha cart — persisted in localStorage.
 */
(function (global) {
  var STORAGE_KEY = "bb_cart_v1";

  function readRaw() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeRaw(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
    dispatchChange();
  }

  var listeners = [];

  function dispatchChange() {
    listeners.forEach(function (fn) {
      try {
        fn();
      } catch (e) {}
    });
    try {
      document.dispatchEvent(new CustomEvent("bb-cart-change"));
    } catch (err) {}
  }

  function lineKey(item) {
    return item.productId + "::" + item.size;
  }

  function normalizeItem(item) {
    if (!item || !item.priceId || !item.productId || !item.size) return null;
    var qty = parseInt(item.quantity, 10);
    if (!qty || qty < 1) qty = 1;
    if (qty > 99) qty = 99;
    return {
      productId: String(item.productId),
      size: String(item.size),
      priceId: String(item.priceId),
      name: String(item.name || "Item"),
      sizeLabel: String(item.sizeLabel || item.size),
      unitAmount: parseInt(item.unitAmount, 10) || 0,
      quantity: qty,
      image: item.image ? String(item.image) : "",
    };
  }

  var BBCart = {
    getItems: function () {
      return readRaw().map(normalizeItem).filter(Boolean);
    },

    getCount: function () {
      return this.getItems().reduce(function (sum, row) {
        return sum + row.quantity;
      }, 0);
    },

    getSubtotal: function () {
      return this.getItems().reduce(function (sum, row) {
        return sum + row.unitAmount * row.quantity;
      }, 0);
    },

    add: function (item) {
      var row = normalizeItem(item);
      if (!row) return;
      if (row.priceId.indexOf("price_REPLACE") === 0) {
        console.warn("Buddy Buddha: replace placeholder Stripe price IDs in data/products.json");
      }
      var items = readRaw();
      var key = lineKey(row);
      var found = false;
      items = items.map(function (existing) {
        var norm = normalizeItem(existing);
        if (!norm) return existing;
        if (lineKey(norm) === key) {
          found = true;
          norm.quantity = Math.min(99, norm.quantity + row.quantity);
          return norm;
        }
        return norm;
      });
      if (!found) items.push(row);
      writeRaw(items);
    },

    setQuantity: function (productId, size, quantity) {
      var qty = parseInt(quantity, 10);
      var items = readRaw()
        .map(normalizeItem)
        .filter(Boolean)
        .map(function (row) {
          if (row.productId === productId && row.size === size) {
            row.quantity = qty;
          }
          return row;
        })
        .filter(function (row) {
          return row.quantity > 0;
        });
      writeRaw(items);
    },

    remove: function (productId, size) {
      var items = readRaw()
        .map(normalizeItem)
        .filter(Boolean)
        .filter(function (row) {
          return !(row.productId === productId && row.size === size);
        });
      writeRaw(items);
    },

    clear: function () {
      writeRaw([]);
    },

    onChange: function (fn) {
      if (typeof fn === "function") listeners.push(fn);
    },
  };

  global.BBCart = BBCart;
})(typeof window !== "undefined" ? window : global);
