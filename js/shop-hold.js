(function () {
  function applyHold() {
    if (window.BB_SHOP && window.BB_SHOP.enabled) return;

    document.querySelectorAll(".js-shop-only").forEach(function (el) {
      el.hidden = true;
    });

    document.querySelectorAll(".js-shop-hold-only").forEach(function (el) {
      el.hidden = false;
    });
  }

  applyHold();
  document.addEventListener("site-shell-ready", applyHold);
})();
