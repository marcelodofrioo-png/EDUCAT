import { useEffect, useRef, useState } from "react";

export default function Hero() {
  const heroRef = useRef(null);
  const cleanRef = useRef(null);
  const messyRef = useRef(null);
  const [fullChaos, setFullChaos] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });

  const canHover = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Toggle full room view
  const toggleFullView = (e) => {
    e?.stopPropagation?.();
    setFullChaos((prev) => !prev);
  };

  // Touch tap toggles the view on mobile
  const onHeroClick = (e) => {
    if (canHover()) return;
    if (e.target.closest("a, button")) return;
    toggleFullView();
  };

  const onPointerMove = (e) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    setLensPos({ x, y });
    el.style.setProperty("--x", `${xPercent}%`);
    el.style.setProperty("--y", `${yPercent}%`);
  };

  const onPointerEnter = (e) => {
    if (!canHover()) return;
    setIsHovering(true);
    onPointerMove(e);
  };

  const onPointerLeave = () => {
    setIsHovering(false);
  };

  // Reset when leaving viewport
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setFullChaos(false);
    });
    if (heroRef.current) io.observe(heroRef.current);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={heroRef}
      className={`hero ${fullChaos ? "is-chaos" : ""}`}
      id="home"
      aria-labelledby="hero-title"
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onHeroClick}
      style={{
        "--r": fullChaos ? "150%" : isHovering ? "170px" : "0px",
        "--reveal-opacity": fullChaos || isHovering ? "1" : "0",
      }}
    >
      {/* Background scenes */}
      <div className="reveal" data-state={fullChaos ? "chaos" : "calm"}>
        {/* Primary scene: clean organized room */}
        <img
          ref={cleanRef}
          className="reveal-img reveal-img--clean"
          src="/images/dog-clean.jpg"
          alt="Max, um cachorro caramelo em estilo cartoon, sentado tranquilamente em um sofá numa sala organizada e aconchegante."
          width="1024"
          height="576"
          fetchPriority="high"
          decoding="async"
        />

        {/* Secondary scene: messy room (revealed cleanly wherever the cursor moves) */}
        <img
          ref={messyRef}
          className="reveal-img reveal-img--messy"
          src="/images/dog-messy.jpg"
          alt="O mesmo Max, com um chinelo na boca, no mesmo sofá agora rasgado, com almofadas destruídas e papel higiênico espalhado pela sala."
          width="1024"
          height="576"
          decoding="async"
          aria-hidden="true"
        />
        <div className="hero-scrim" aria-hidden="true" />
      </div>

      {/* Clean lens ring indicator (clean window showing the second image behind) */}
      {!fullChaos && isHovering && (
        <div
          className="reveal-lens-ring"
          style={{
            transform: `translate3d(${lensPos.x}px, ${lensPos.y}px, 0)`,
          }}
          aria-hidden="true"
        >
          <span className="lens-tag">Sem cuidados</span>
        </div>
      )}

      {/* State pill */}
      <div className="hero-status container-x">
        <button
          className="status-pill anim-rise"
          style={{ animationDelay: ".45s" }}
          type="button"
          aria-pressed={fullChaos}
          onClick={toggleFullView}
          id="reveal-toggle"
        >
          <span className="status-dot" aria-hidden="true" />
          <span className="status-label">
            {fullChaos ? "Sem cuidados (Caos total)" : "Com cuidados (Organizado)"}
          </span>
          <span className="status-hint hint-hover">Passe o mouse para espiar</span>
          <span className="status-hint hint-touch">Toque para alternar</span>
        </button>
      </div>

      {/* Hero content positioned at bottom-left */}
      <div className="hero-content container-x">
        <h1 className="hero-title anim-rise" id="hero-title">
          Seu melhor amigo.
          <br />
          Sua casa.
          <br />
          <em>Menos caos.</em>
        </h1>
        <p className="hero-text anim-rise" style={{ animationDelay: ".12s" }}>
          Pequenos hábitos fazem toda a diferença. Descubra como cuidar melhor do seu pet, estimular bons
          comportamentos e manter sua casa mais tranquila, sem deixar a diversão de lado.
        </p>
        <div className="hero-actions anim-rise" style={{ animationDelay: ".22s" }}>
          <a href="#cuidados" className="btn btn-primary" id="hero-cta">
            Descubra como
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M4 10h11m-4-4 4 4-4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <p className="hero-aux">
            Mais cuidado para eles.
            <br />
            Mais tranquilidade para você.
          </p>
        </div>
      </div>
    </section>
  );
}
