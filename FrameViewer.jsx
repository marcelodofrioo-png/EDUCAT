import { useState, useRef, useCallback, useEffect } from "react";
import PixelRevealStage from "@/components/ui/PixelRevealStage";

export default function FrameViewer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [effectMode, setEffectMode] = useState("pixel"); // "pixel" | "circle" | "split"
  const [coords, setCoords] = useState({ x: 937, y: 550, xPercent: 50 });
  const [isHovering, setIsHovering] = useState(false);

  // Update cursor position for split mode and circle mode
  const handleStageMove = useCallback((e) => {
    const stage = e.currentTarget;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    const xPercent = (x / rect.width) * 100;
    setCoords({ x, y, xPercent });
    setIsHovering(true);
  }, []);

  return (
    <div className="layout-canvas-wrapper">
      {/* 1874x1083 Stage Container */}
      <div
        className="layout-stage"
        onPointerMove={handleStageMove}
        onPointerLeave={() => setIsHovering(false)}
      >
        {/* =========================================================
            EFFECT 1: PIXEL TRAIL (DEFAULT - from pixel-cursor.tsx prompt)
            Renders Frame 3, punches transparent pixelated trail holes
            to reveal Frame 2 behind without any black color or labels.
            ========================================================= */}
        {effectMode === "pixel" ? (
          <PixelRevealStage
            imageFront="/images/frame-3.svg"
            imageBack="/images/frame-2.svg"
            blockSize={26}
            cursorRadius={190}
          />
        ) : (
          /* =========================================================
              EFFECT 2 & 3: SMOOTH CIRCLE OR SPLIT
              ========================================================= */
          <div className="relative w-full h-full overflow-hidden select-none">
            {/* Base: Frame 3 */}
            <img
              src="/images/frame-3.svg"
              alt="Frame 3"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              draggable={false}
            />

            {/* Revealed: Frame 2 */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
              style={{
                clipPath:
                  effectMode === "split"
                    ? `inset(0 0 0 ${coords.xPercent}%)`
                    : isHovering
                    ? `circle(220px at ${coords.x}px ${coords.y}px)`
                    : "circle(0px at 50% 50%)",
                WebkitClipPath:
                  effectMode === "split"
                    ? `inset(0 0 0 ${coords.xPercent}%)`
                    : isHovering
                    ? `circle(220px at ${coords.x}px ${coords.y}px)`
                    : "circle(0px at 50% 50%)",
                transition: "clip-path 0.04s linear",
              }}
            >
              <img
                src="/images/frame-2.svg"
                alt="Frame 2"
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
              />
            </div>

            {/* Split divider line */}
            {effectMode === "split" && (
              <div
                className="stage-split-line"
                style={{ left: `${coords.xPercent}%` }}
                aria-hidden="true"
              >
                <div className="split-line-pill">Frame 3 ◀ | ▶ Frame 2</div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            UI OVERLAYS: Exactly matching the user's 5 wireframe boxes
            ========================================================= */}
        <div className="stage-ui-overlay">
          {/* 1. TOP-LEFT: LOGO (PETEDUCA) - Sem fundo, tamanho ampliado */}
          <div className="ui-box ui-logo-box">
            <a href="#home" className="brand-logo-link" title="PetEduca - Início">
              <img
                src="/images/logo-peteduca.png"
                alt="PetEduca"
                className="brand-logo-img"
              />
            </a>
          </div>

          {/* 2. TOP-CENTER: SEARCH BAR + NAV (QUEM SOMOS, SERVIÇOS, ETC.) */}
          <div className="ui-box ui-search-nav-bar">
            {/* Search component */}
            <div className="search-field-wrapper">
              <span className="search-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="9" r="6" />
                  <path d="M13.5 13.5L18 18" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Pesquisar dicas, serviços ou cuidados..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Barra de pesquisa"
              />
            </div>

            <div className="nav-divider" aria-hidden="true" />

            {/* Nav links */}
            <nav className="header-nav-links" aria-label="Navegação rápida">
              <a href="#quem-somos" className="nav-item">Quem somos</a>
              <a href="#servicos" className="nav-item">Serviços</a>
              <a href="#dicas" className="nav-item">Dicas pet</a>
              <a href="#contato" className="nav-item">Contato</a>
            </nav>
          </div>

          {/* 3. TOP-RIGHT: BOTÃO VERDE (SAIBA MAIS) */}
          <div className="ui-box ui-top-btn-box">
            <button
              type="button"
              className="btn-wireframe-green"
              onClick={() => setActiveModal("saiba-mais")}
              id="btn-saiba-mais"
            >
              <span>Saiba mais</span>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 8h10m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* 4. BOTTOM-LEFT: HEADLINE */}
          <div className="ui-box ui-text-card" style={{ background: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none', border: 'none', boxShadow: 'none' }}>
            <span className="hero-subtitle-small">CUIDADOS & COMPORTAMENTO PET</span>
            <h1 className="hero-headline-raw">
              NÃO DEIXE<br />SUA CASA<br />VIRAR UM<br /><span className="headline-accent">CAOS!</span>
            </h1>
          </div>

          {/* 5. BOTTOM-RIGHT: BOTÃO AMARELO (COMPRAR) */}
          <div className="ui-box ui-bottom-btn-box">
            <button
              type="button"
              className="btn-wireframe-yellow"
              onClick={() => setActiveModal("comprar")}
              id="btn-comprar"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="cart-icon">
                <path d="M3 3h2l.4 2M7 13h10l1.2-6H5.4M7 13l-1.4 3h12M7 13h10M9 18a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              <span>Comprar</span>
            </button>
          </div>

          {/* Scroll Cue Button: Smooth scroll to Section 2 */}
          <a href="#filosofia" className="scroll-down-cue" title="Role para ver o método">
            <span>Conheça a filosofia</span>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" className="bounce-arrow">
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {/* Optical gradient blur blend across the boundary into Section 2 */}
        <div className="stage-bottom-blur-blend" aria-hidden="true" />
      </div>

      {/* Floating Modal for button interactions */}
      {activeModal && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setActiveModal(null)}
              aria-label="Fechar"
            >
              ✕
            </button>
            {activeModal === "saiba-mais" ? (
              <>
                <span className="modal-icon">🐾</span>
                <h3>Como funciona o método PetEduca?</h3>
                <p>
                  Ajudamos tutores a transformar cães agitados e destrutivos em companheiros equilibrados e tranquilos através de técnicas modernas de enriquecimento ambiental, brinquedos ocupacionais e rotinas estruturadas.
                </p>
                <button className="btn-modal-action" onClick={() => setActiveModal(null)}>
                  Entendido!
                </button>
              </>
            ) : (
              <>
                <span className="modal-icon">⭐</span>
                <h3>Garanta o Guia Prático PetEduca</h3>
                <p>
                  Acesso imediato a videoaulas, cardápio de enriquecimento mental e suporte para devolver a paz à sua sala de estar.
                </p>
                <button className="btn-modal-action yellow" onClick={() => setActiveModal(null)}>
                  Continuar para o Carrinho
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
