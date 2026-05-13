(function () {
  function replaceMount(id, html) {
    var mount = document.getElementById(id);
    if (!mount || !html) return;
    var wrap = document.createElement("div");
    wrap.innerHTML = html.trim();
    var node = wrap.firstElementChild;
    if (node) mount.replaceWith(node);
  }

  function setActiveNav(active) {
    document.querySelectorAll(".nav-link[data-nav-match]").forEach(function (link) {
      link.classList.remove("nav-link--active");
      if (link.getAttribute("data-nav-match") === active) {
        link.classList.add("nav-link--active");
      }
    });
  }

  function initMobileNav() {
    var header = document.getElementById("site-header");
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!header || !toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("is-nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (el) {
      el.addEventListener("click", function () {
        header.classList.remove("is-nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-nav-open")) {
        header.classList.remove("is-nav-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  var active = document.body.getAttribute("data-nav-active") || "home";

  Promise.all([
    fetch("partials/header.html").then(function (r) {
      return r.text();
    }),
    fetch("partials/footer.html").then(function (r) {
      return r.text();
    }),
  ])
    .then(function (parts) {
      replaceMount("site-header-root", parts[0]);
      replaceMount("site-footer-root", parts[1]);
      setActiveNav(active);
      initMobileNav();
      document.dispatchEvent(new CustomEvent("site-shell-ready"));
    })
    .catch(function () {
      document.dispatchEvent(new CustomEvent("site-shell-error"));
    });
})();
