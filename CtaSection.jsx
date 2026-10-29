import { useState } from "react";
import FadeIn from "./FadeIn.jsx";

export default function CtaSection() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMsg("Ops! Confira o e-mail digitado.");
      return;
    }
    setMsg("Prontinho! Seu plano está a caminho. O sofá agradece. 🐾");
    setEmail("");
  };

  return (
    <section className="section section--cream cta" id="comecar" aria-labelledby="cta-title">
      <FadeIn className="container-x cta-inner">
        <h2 className="section-title" id="cta-title">
          Pronto para <em>menos caos</em>?
        </h2>
        <p className="section-lead">
          Receba um plano de cuidados personalizado para o seu cão, gratuito, direto no seu e-mail.
        </p>
        <form className="cta-form" id="cta-form" noValidate onSubmit={onSubmit}>
          <label htmlFor="cta-email" className="sr-only">
            Seu e-mail
          </label>
          <input
            type="email"
            id="cta-email"
            placeholder="seu@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" id="cta-submit">
            Começar agora
          </button>
        </form>
        <p className="cta-feedback" role="status" aria-live="polite">
          {msg}
        </p>
      </FadeIn>
    </section>
  );
}
