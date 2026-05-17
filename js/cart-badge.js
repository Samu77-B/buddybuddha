(function () {
  function updateBadge() {
    var el = document.getElementById("cart-count");
    if (!el || typeof BBCart === "undefined") return;
    var n = BBCart.getCount();
    el.textContent = String(n);
    el.hidden = n === 0;
    el.setAttribute("aria-label", n === 1 ? "1 item in basket" : n + " items in basket");
  }

  function init() {
    updateBadge();
    if (typeof BBCart !== "undefined") {
      BBCart.onChange(updateBadge);
    }
    document.addEventListener("bb-cart-change", updateBadge);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  document.addEventListener("site-shell-ready", updateBadge);
})();
