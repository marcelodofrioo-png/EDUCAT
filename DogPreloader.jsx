import React, { useState, useEffect, useRef } from "react";

const TOTAL_FRAMES = 90;
const FRAME_PATHS = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const pad = String(i).padStart(4, "0");
  return `/images/dog-frames/generated_video_${pad}.png`;
});

export default function DogPreloader({ onFinish }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  const imagesRef = useRef([]);

  // 1. Preload all 90 frames for instant, zero-flicker playback
  useEffect(() => {
    const loadedImages = [];
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = FRAME_PATHS[i];
      loadedImages.push(img);
    }
    imagesRef.current = loadedImages;
  }, []);

  // 2. Play dog running animation at ~18 FPS
  useEffect(() => {
    if (isRemoved) return;
    let animId;
    let lastTime = performance.now();
    const frameInterval = 1000 / 18; // ~55ms per frame

    const loop = (currentTime) => {
      if (currentTime - lastTime >= frameInterval) {
        setFrameIndex((prev) => (prev + 1) % TOTAL_FRAMES);
        lastTime = currentTime;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRemoved]);

  // 3. Smooth progress bar simulation and luxurious, soft exit transition
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let currentProgress = 0;
    const interval = setInterval(() => {
      // Natural variable speed progress
      const increment = Math.max(1.2, (100 - currentProgress) * 0.085 + Math.random() * 2.5);
      currentProgress += increment;

      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
        clearInterval(interval);

        // Peaceful hold at 100% so the completed state is smoothly registered
        setTimeout(() => {
          setIsFading(true);
          // Unlock body overflow as fade begins so interaction is ready
          document.body.style.overflow = originalOverflow;

          // Remove completely after smooth 850ms exit transition
          setTimeout(() => {
            setIsRemoved(true);
            if (onFinish) onFinish();
          }, 850);
        }, 400);
      } else {
        setProgress(Math.floor(currentProgress));
      }
    }, 45);

    return () => {
      clearInterval(interval);
      document.body.style.overflow = originalOverflow;
    };
  }, [onFinish]);

  if (isRemoved) return null;

  return (
    <div
      className={`dog-preloader-overlay ${isFading ? "is-fading" : ""}`}
      style={{
        opacity: isFading ? 0 : 1,
        transition: "opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: isFading ? "none" : "auto",
        transform: isFading ? "scale(1.02)" : "scale(1)",
      }}
      aria-hidden="true"
    >
      <div
        className="dog-preloader-center"
        style={{
          opacity: isFading ? 0 : 1,
          transform: isFading ? "translateY(-20px) scale(1.03)" : "translateY(0) scale(1)",
          filter: isFading ? "blur(8px)" : "blur(0px)",
          transition: "opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1), filter 0.65s ease",
        }}
      >
        {/* Animated Cartoon Dog */}
        <div className="dog-preloader-frame-wrapper">
          <img
            src={FRAME_PATHS[frameIndex]}
            alt=""
            width={248}
            height={134}
            className="dog-preloader-img"
            draggable={false}
          />
        </div>

        {/* Navy Blue Loading Bar with Light Yellow Fill */}
        <div className="dog-preloader-bar-track">
          <div
            className="dog-preloader-bar-fill"
            style={{
              width: `${progress}%`,
              transition: "width 0.18s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
