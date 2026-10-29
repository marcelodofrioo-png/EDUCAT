import { useEffect, useState } from "react";

const LINKS = [
  { id: "home", label: "Home" },
  { id: "cuidados", label: "Cuidados" },
  { id: "sobre", label: "Sobre nós" },
];

export function BrandLogo({ className = "brand-logo" }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="currentColor" opacity=".12" />
      <ellipse cx="20" cy="25" rx="7.2" ry="6" fill="currentColor" />
      <ellipse cx="11.5" cy="17" rx="3" ry="3.8" fill="currentColor" />
      <ellipse cx="17" cy="11.5" rx="3" ry="3.8" fill="currentColor" />
      <ellipse cx="23" cy="11.5" rx="3" ry="3.8" fill="currentColor" />
      <ellipse cx="28.5" cy="17" rx="3" ry="3.8" fill="currentColor" />
    </svg>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`} id="site-header">
      <div className="container-x header-inner anim-rise">
        <a href="#home" className="brand" id="brand-link" aria-label="Pacato — página inicial" onClick={close}>
          <BrandLogo />
          <span className="brand-name">
            Pacato<span className="brand-dot">.</span>
          </span>
        </a>

        <button
          className="nav-toggle"
          id="nav-toggle"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>

        <nav className={`site-nav ${open ? "is-open" : ""}`} id="site-nav" aria-label="Navegação principal">
          {LINKS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              id={`nav-${id}`}
              className={`nav-link ${active === id ? "is-active" : ""}`}
              onClick={close}
            >
              {label}
            </a>
          ))}
          <a href="#comecar" className="btn btn-light" id="nav-cta" onClick={close}>
            Começar agora
          </a>
        </nav>
      </div>
    </header>
  );
}
