import React from "react";
import { motion } from "motion/react";

/**
 * FadeIn — Smooth scroll-triggered entrance animation using motion/react.
 * Elements smoothly glide up and fade in when they enter the viewport.
 */
export default function FadeIn({
  as: Tag = "div",
  delay = 0,
  className = "",
  children,
  ...rest
}) {
  const MotionTag = (typeof Tag === "string" && motion[Tag])
    ? motion[Tag]
    : motion.div;

  return (
    <MotionTag
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.75,
        delay: delay / 1000,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
