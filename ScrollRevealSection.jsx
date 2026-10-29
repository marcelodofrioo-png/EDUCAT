import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";

const TOTAL_WORDS = 13;

const RevealWord = ({ word, globalIndex, progress }) => {
  // Words reveal progressively from scroll 0.08 up to 0.65
  // Pinned holding buffer from 0.65 to 1.0 for comfortable reading time!
  const revealStart = 0.08;
  const revealEnd = 0.65;
  const step = (revealEnd - revealStart) / TOTAL_WORDS;

  const start = revealStart + globalIndex * step;
  const end = Math.min(revealEnd, start + step * 1.5);

  const opacity = useTransform(progress, [start, end], [0.12, 1]);
  const blurVal = useTransform(progress, [start, end], [6, 0]);
  const filter = useTransform(blurVal, (v) => `blur(${v}px)`);
  const y = useTransform(progress, [start, end], [8, 0]);

  return (
    <motion.span
      style={{ opacity, filter, y }}
      className="scroll-word"
    >
      {word}
    </motion.span>
  );
};

export default function ScrollRevealSection() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Spring smoothing for fluid mouse wheel experience
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 26,
    restDelta: 0.001,
  });

  // Entrance rise animation: text smoothly glides up as the user scrolls into Section 2
  const entranceY = useTransform(smoothProgress, [0.0, 0.08], [64, 0]);
  const entranceOpacity = useTransform(smoothProgress, [0.0, 0.06], [0.1, 1]);
  const entranceScale = useTransform(smoothProgress, [0.0, 0.08], [0.96, 1]);

  const sentence1Words = "Seu cachorro não precisa de mais broncas.".split(" ");
  const sentence2Words = "Ele precisa aprender a entender você.".split(" ");

  return (
    <section ref={containerRef} className="scroll-reveal-container" id="filosofia">
      <div className="scroll-reveal-sticky">
        {/* Soft gradient blur blend at the top transition from Home */}
        <div className="section-top-blur-blend" aria-hidden="true" />

        {/* Soft background ambient glow spot */}
        <div className="scroll-white-glow glow-center" aria-hidden="true" />

        {/* Animated text content wrapper that glides up into place */}
        <motion.div
          className="scroll-reveal-content"
          style={{
            y: entranceY,
            opacity: entranceOpacity,
            scale: entranceScale,
          }}
        >
          <h2 className="scroll-reveal-heading">
            <span className="scroll-sentence-block">
              {sentence1Words.map((word, i) => (
                <RevealWord
                  key={`s1-${i}-${word}`}
                  word={word}
                  globalIndex={i}
                  progress={smoothProgress}
                />
              ))}
            </span>

            <span className="scroll-sentence-block highlight-sentence">
              {sentence2Words.map((word, i) => (
                <RevealWord
                  key={`s2-${i}-${word}`}
                  word={word}
                  globalIndex={sentence1Words.length + i}
                  progress={smoothProgress}
                />
              ))}
            </span>
          </h2>
        </motion.div>
      </div>
    </section>
  );
}
