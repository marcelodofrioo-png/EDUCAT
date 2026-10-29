import React, { useRef, useEffect, useCallback, useState } from "react";

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
  radius: number;
}

interface PixelRevealStageProps {
  imageFront: string;
  imageBack: string;
  blockSize?: number; // Size of pixel blocks (e.g. 26px)
  cursorRadius?: number; // Radius of transparent reveal (e.g. 190px)
  smooth?: boolean; // When true (default), cursor reveal is smooth and anti-aliased without pixels
  className?: string;
}

export const PixelRevealStage: React.FC<PixelRevealStageProps> = ({
  imageFront,
  imageBack,
  blockSize = 26,
  cursorRadius = 190,
  smooth = true,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgFrontRef = useRef<HTMLImageElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isHovering, setIsHovering] = useState(true);

  const mouseRef = useRef({
    target: { x: -1000, y: -1000 },
    current: { x: -1000, y: -1000 },
  });
  const trailRef = useRef<TrailPoint[]>([]);
  const animFrameRef = useRef<number | undefined>(undefined);

  // Linear interpolation utility
  const lerp = (start: number, end: number, t: number): number => {
    return start * (1 - t) + end * t;
  };

  // Preload front image for canvas drawing
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageFront;
    img.onload = () => {
      imgFrontRef.current = img;
      setIsReady(true);
    };
  }, [imageFront]);

  // Resize canvas to match container's exact screen pixels
  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Set initial position to center over the dog
    if (mouseRef.current.target.x === -1000) {
      const initX = (rect.width * 0.5) * dpr;
      const initY = (rect.height * 0.55) * dpr;
      mouseRef.current.target = { x: initX, y: initY };
      mouseRef.current.current = { x: initX, y: initY };
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // Main rendering loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const imgFront = imgFrontRef.current;
    if (!canvas || !imgFront) {
      animFrameRef.current = requestAnimationFrame(render);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scaledBlockSize = blockSize * dpr;
    const scaledRadius = cursorRadius * dpr;

    // 1. Draw base front image (Frame 3) using object-fit: cover calculation
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);

    const canvasRatio = W / H;
    const imgRatio = 1874 / 1083;
    let drawW: number, drawH: number, drawX: number, drawY: number;

    if (canvasRatio > imgRatio) {
      drawW = W;
      drawH = W / imgRatio;
      drawX = 0;
      drawY = (H - drawH) / 2;
    } else {
      drawH = H;
      drawW = H * imgRatio;
      drawY = 0;
      drawX = (W - drawW) / 2;
    }

    ctx.drawImage(imgFront, drawX, drawY, drawW, drawH);

    // 2. Smoothly update current mouse position via lerp
    const mouse = mouseRef.current;
    mouse.current.x = lerp(mouse.current.x, mouse.target.x, 0.16);
    mouse.current.y = lerp(mouse.current.y, mouse.target.y, 0.16);

    // 3. Add current position to trail if hovering, interpolating intermediate points for buttery smooth stroke
    if (isHovering && mouse.current.x > 0) {
      const lastPt = trailRef.current[trailRef.current.length - 1];
      if (lastPt) {
        const dist = Math.hypot(mouse.current.x - lastPt.x, mouse.current.y - lastPt.y);
        if (dist > 18) {
          const steps = Math.min(6, Math.floor(dist / 14));
          for (let s = 1; s < steps; s++) {
            const factor = s / steps;
            trailRef.current.push({
              x: lerp(lastPt.x, mouse.current.x, factor),
              y: lerp(lastPt.y, mouse.current.y, factor),
              alpha: 0.95,
              radius: scaledRadius,
            });
          }
        }
      }
      trailRef.current.push({
        x: mouse.current.x,
        y: mouse.current.y,
        alpha: 1.0,
        radius: scaledRadius,
      });
    }

    // 4. Update and filter trail points
    const nextTrail: TrailPoint[] = [];
    for (let i = 0; i < trailRef.current.length; i++) {
      const pt = trailRef.current[i];
      pt.alpha -= 0.038; // Smooth trail fade
      if (pt.alpha > 0.015) {
        nextTrail.push(pt);
      }
    }
    trailRef.current = nextTrail;

    // 5. Punch transparent holes through Frame 3 to reveal Frame 2 behind
    if (isHovering || trailRef.current.length > 0) {
      ctx.globalCompositeOperation = "destination-out";

      if (smooth) {
        // SMOOTH CURSOR: Feathered radial gradient with anti-aliasing (liso sem pixel)
        const stampSmoothCircle = (cx: number, cy: number, r: number, alpha: number) => {
          if (r <= 0 || alpha <= 0.005) return;
          ctx.beginPath();
          const gradient = ctx.createRadialGradient(cx, cy, r * 0.75, cx, cy, r);
          gradient.addColorStop(0, `rgba(0, 0, 0, ${Math.min(1, alpha)})`);
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = gradient;
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        };

        // Draw smooth fading trail points
        for (const pt of trailRef.current) {
          stampSmoothCircle(pt.x, pt.y, pt.radius, pt.alpha * 0.85);
        }

        // Draw active cursor head (100% transparent smooth opening)
        if (isHovering && mouse.current.x > 0) {
          stampSmoothCircle(mouse.current.x, mouse.current.y, scaledRadius, 1.0);
        }
      } else {
        // RETRO PIXEL FALLBACK (if smooth=false)
        const stampPixelCircle = (cx: number, cy: number, r: number, alpha: number) => {
          const startX = Math.floor((cx - r) / scaledBlockSize) * scaledBlockSize;
          const endX = Math.ceil((cx + r) / scaledBlockSize) * scaledBlockSize;
          const startY = Math.floor((cy - r) / scaledBlockSize) * scaledBlockSize;
          const endY = Math.ceil((cy + r) / scaledBlockSize) * scaledBlockSize;

          for (let bx = startX; bx <= endX; bx += scaledBlockSize) {
            for (let by = startY; by <= endY; by += scaledBlockSize) {
              const dx = bx + scaledBlockSize / 2 - cx;
              const dy = by + scaledBlockSize / 2 - cy;
              if (dx * dx + dy * dy <= r * r) {
                ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                ctx.fillRect(bx, by, scaledBlockSize - 1.5, scaledBlockSize - 1.5);
              }
            }
          }
        };

        for (const pt of trailRef.current) {
          stampPixelCircle(pt.x, pt.y, pt.radius, pt.alpha * 0.85);
        }

        if (isHovering && mouse.current.x > 0) {
          stampPixelCircle(mouse.current.x, mouse.current.y, scaledRadius, 1.0);
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(render);
  }, [blockSize, cursorRadius, isHovering, smooth]);

  // Start animation loop
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [render]);

  // Map pointer client coordinates directly to canvas pixel space
  const handlePointer = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const x = (clientX - rect.left) * dpr;
    const y = (clientY - rect.top) * dpr;

    mouseRef.current.target.x = x;
    mouseRef.current.target.y = y;
    setIsHovering(true);
  }, []);

  // Global window pointer listener
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        handlePointer(e.clientX, e.clientY);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("mousemove", onMove);
    };
  }, [handlePointer]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      onPointerMove={(e) => handlePointer(e.clientX, e.clientY)}
      onPointerEnter={(e) => handlePointer(e.clientX, e.clientY)}
      onPointerLeave={() => setIsHovering(false)}
      onTouchMove={(e) => {
        if (e.touches[0]) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }}
    >
      {/* LAYER 1: Background image (Frame 2.svg - revealed through transparency) */}
      <img
        src={imageBack}
        alt="Frame 2"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        draggable={false}
      />

      {/* LAYER 2: Canvas rendering Frame 3.svg with transparent pixelated trail holes */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      />

      {/* Fallback image while canvas image is loading */}
      {!isReady && (
        <img
          src={imageFront}
          alt="Frame 3"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        />
      )}
    </div>
  );
};

export default PixelRevealStage;
