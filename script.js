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

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Progreso de scroll, header compacto y parallax.
  const header = document.querySelector(".site-header");
  const progress = document.querySelector("[data-scroll-progress]");
  const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
  let parallaxItems = [];
  let resizeTimer = 0;
  let ticking = false;

  const applyScroll = () => {
    const y = window.scrollY || 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    if (header) header.classList.toggle("is-scrolled", y > 14);
    if (reduced || !parallaxItems.length) return;
    const viewCenter = y + window.innerHeight / 2;
    parallaxItems.forEach((item) => {
      const offset = Math.max(-42, Math.min(42, (viewCenter - item.center) * item.speed));
      item.el.style.setProperty("--parallax", `${offset.toFixed(2)}px`);
    });
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      applyScroll();
      ticking = false;
    });
  };

  const measureParallax = () => {
    parallaxEls.forEach((el) => el.style.removeProperty("--parallax"));
    parallaxItems = parallaxEls.map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        el,
        speed: Number(el.dataset.parallax) || 0.1,
        center: rect.top + window.scrollY + rect.height / 2,
      };
    });
    applyScroll();
  };

  if (parallaxEls.length && !reduced) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measureParallax, 160);
    });
    window.addEventListener("load", measureParallax, { once: true });
    measureParallax();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measureParallax).catch(() => {});
    }
  } else {
    applyScroll();
  }

  // Reveal con entrada escalonada.
  const revealTargets = Array.from(document.querySelectorAll(".reveal"));
  revealTargets.forEach((target) => {
    const siblings = Array.from(target.parentElement ? target.parentElement.children : []).filter((el) =>
      el.classList.contains("reveal")
    );
    const index = Math.max(0, siblings.indexOf(target));
    target.dataset.revealDelay = String(Math.min(index, 5) * 65);
  });

  if (!reduced && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && entry.boundingClientRect.top > 0) return;
          const el = entry.target;
          revealObserver.unobserve(el);
          const delay = Number(el.dataset.revealDelay || 0);
          window.setTimeout(() => el.classList.add("is-visible"), delay);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealTargets.forEach((target) => revealObserver.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
  }

  // Cifras que suben al entrar en pantalla.
  const counters = Array.from(document.querySelectorAll("[data-count]"));
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    el.textContent = "0";
    const duration = 1200;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const progressValue = Math.min((now - start) / duration, 1);
      el.textContent = String(Math.round(target * ease(progressValue)));
      if (progressValue < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = String(target);
      }
    };
    requestAnimationFrame(tick);
  };

  if (counters.length && !reduced && "IntersectionObserver" in window) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          countObserver.unobserve(entry.target);
          animateCount(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => countObserver.observe(el));
  }

  // Interacciones de puntero fino (sin afectar táctil ni reduced motion).
  if (finePointer && !reduced) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      const max = Number(card.dataset.tilt) || 6;
      const reset = () => {
        card.classList.remove("is-tilting");
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      };
      card.addEventListener("pointerenter", () => card.classList.add("is-tilting"));
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--ry", `${(px * max).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${(-py * max).toFixed(2)}deg`);
      });
      card.addEventListener("pointerleave", reset);
      card.addEventListener("blur", reset, true);
    });

    document.querySelectorAll("[data-spotlight]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${(event.clientX - rect.left).toFixed(0)}px`);
        card.style.setProperty("--my", `${(event.clientY - rect.top).toFixed(0)}px`);
      });
    });

    document.querySelectorAll(".hero-actions .btn, .split-actions .btn, .cta-actions .btn").forEach((button) => {
      const strength = 7;
      button.setAttribute("data-magnetic", "");
      button.addEventListener("pointermove", (event) => {
        const rect = button.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        button.style.setProperty("--mag-x", `${(px * strength * 2).toFixed(2)}px`);
        button.style.setProperty("--mag-y", `${(py * strength).toFixed(2)}px`);
      });
      button.addEventListener("pointerleave", () => {
        button.style.setProperty("--mag-x", "0px");
        button.style.setProperty("--mag-y", "0px");
      });
    });

    const hero = document.querySelector(".hero");
    if (hero) {
      hero.addEventListener("pointermove", (event) => {
        const rect = hero.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        hero.style.setProperty("--hx", `${(px * 16).toFixed(2)}px`);
        hero.style.setProperty("--hy", `${(py * 12).toFixed(2)}px`);
      });
      hero.addEventListener("pointerleave", () => {
        hero.style.setProperty("--hx", "0px");
        hero.style.setProperty("--hy", "0px");
      });
    }
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

  window.__motionReady = true;
})();
