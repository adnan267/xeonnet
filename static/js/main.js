// Xeon Net — frontend interactions
document.documentElement.classList.add("js");

if (window.lucide) lucide.createIcons();

// Sticky nav background
const nav = document.getElementById("nav");
const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 20);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Mobile menu
const toggle = document.getElementById("navToggle");
if (toggle) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  document.querySelectorAll("#navLinks a").forEach(a =>
    a.addEventListener("click", () => nav.classList.remove("open")));
}

// Reveal on scroll
const io = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.12 }) : null;
document.querySelectorAll(".reveal").forEach(el => io ? io.observe(el) : el.classList.add("in"));

// Count-up numbers
document.querySelectorAll("[data-count]").forEach(el => {
  const target = parseInt(el.dataset.count, 10);
  if (!target || !io) return;
  el.textContent = "0";
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    const start = performance.now(), dur = 1200;
    const step = t => {
      const p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }).observe(el);
});

// Service tier filter
const tabs = document.querySelectorAll(".tab");
tabs.forEach(tab => tab.addEventListener("click", () => {
  tabs.forEach(t => t.classList.toggle("active", t === tab));
  const key = tab.dataset.tier;
  document.querySelectorAll(".tier").forEach(t =>
    t.classList.toggle("hidden", key !== "all" && t.dataset.tier !== key));
  document.querySelectorAll(".tier:not(.hidden) .reveal").forEach(el => el.classList.add("in"));
}));

// AJAX forms (contact + subscribe) — page reload ke baghair submit
document.querySelectorAll("form[data-ajax]").forEach(form => {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const note = form.querySelector(".form-note");
    const btn = form.querySelector("button[type=submit]");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    btn.disabled = true;
    note.className = "form-note";
    note.textContent = "Sending…";
    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { "X-Requested-With": "fetch" },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        note.classList.add("ok");
        note.textContent = data.message;
        form.reset();
      } else {
        note.classList.add("err");
        note.textContent = (data.errors || ["Kuch ghalat ho gaya, dobara koshish karein."]).join(" ");
      }
    } catch {
      note.classList.add("err");
      note.textContent = "Network error — internet check karein.";
    } finally {
      btn.disabled = false;
    }
  });
});
