(() => {
  const site = window.SITE || {};
  const waNumber = (site.whatsapp || "").replace(/\D/g, "");
  const waText = encodeURIComponent(site.whatsappText || "Hola, quiero información.");

  document.querySelectorAll("[data-wa]").forEach((link) => {
    if (waNumber) link.href = `https://wa.me/${waNumber}?text=${waText}`;
  });

  document.querySelectorAll("[data-email]").forEach((link) => {
    if (site.email) link.href = `mailto:${site.email}`;
  });

  document.querySelectorAll("[data-social]").forEach((link) => {
    const url = site[link.dataset.social];
    if (url) {
      link.href = url;
      link.hidden = false;
      link.removeAttribute("aria-hidden");
      link.setAttribute("rel", "noopener");
      link.setAttribute("target", "_blank");
    }
  });

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  // Cuenta regresiva al cierre del e-CF.
  const deadline = new Date("2026-11-15T23:59:59-04:00");
  const daysLabel = document.querySelector("[data-countdown]");
  if (daysLabel) {
    const diff = deadline.getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days > 0) {
      daysLabel.textContent = `${days} días`;
      daysLabel.dataset.state = "open";
    } else if (days === 0) {
      daysLabel.textContent = "Hoy";
      daysLabel.dataset.state = "today";
    } else {
      daysLabel.textContent = "Plazo vencido";
      daysLabel.dataset.state = "closed";
    }
  }

  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      document.body.classList.toggle("nav-open", !open);
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        document.body.classList.remove("nav-open");
      });
    });
  }

  // Reveal suave al hacer scroll.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = document.querySelectorAll(".reveal");
  if (!reduced && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );
    targets.forEach((target) => observer.observe(target));
  } else {
    targets.forEach((target) => target.classList.add("is-visible"));
  }

  // Resalta el enlace de navegación de la sección visible.
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const navLinks = Array.from(document.querySelectorAll("[data-nav] a[href^='#']"));
  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
          });
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    sections.forEach((section) => spy.observe(section));
  }
})();
