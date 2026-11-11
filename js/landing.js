import { COURSE_OPTIONS } from "./config.js";

const $$ = (selector) => [...document.querySelectorAll(selector)];

export function initializeLanding(showView) {
  $$("[data-course-select]").forEach((select) => {
    COURSE_OPTIONS.forEach((course) => {
      const option = document.createElement("option");
      option.value = course;
      option.textContent = course;
      select.add(option);
    });
  });

  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });
    $$(".landing-section-inner").forEach((section) => {
      section.classList.add("scroll-reveal");
      revealObserver.observe(section);
    });
  }

  $$("[data-view]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
  $$("[data-toggle-password]").forEach((button) => button.addEventListener("click", () => {
    const input = document.querySelector(`#${button.dataset.togglePassword}`);
    const visible = input.type === "password";
    input.type = visible ? "text" : "password";
    button.setAttribute("aria-label", visible ? "Hide password" : "Show password");
    button.setAttribute("aria-pressed", String(visible));
  }));
}
