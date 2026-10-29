import React, { useRef, useEffect, useCallback } from 'react';

interface MouseState {
  target: { x: number; y: number };
  current: { x: number; y: number };
}

interface PixelatedCanvasProps {
  className?: string;
}

const PixelatedCanvas: React.FC<PixelatedCanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<MouseState>({
    target: { x: -100, y: -100 },
    current: { x: -100, y: -100 }
  });
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timeRef = useRef<number>(0);
  const WRef = useRef<number>(32);
  const HRef = useRef<number>(32);

  // Utility functions
  const lerp = (start: number, end: number, t: number): number => {
    return start * (1 - t) + end * t;
  };

  const map = (
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
  ): number => {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  };

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.parentElement?.clientWidth || window.innerWidth;
    const height = canvas.parentElement?.clientHeight || window.innerHeight;

    WRef.current = width * dpr;
    HRef.current = height * dpr;
    canvas.width = WRef.current;
    canvas.height = HRef.current;
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = WRef.current;
    const H = HRef.current;

    // Theme-aware colors
    const isDark = document.documentElement.classList.contains('dark');
    
    // Smooth trail overlay effect
    const overlayColor = isDark ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.08)";
    ctx.fillStyle = overlayColor;
    ctx.fillRect(0, 0, W, H);

    // Update mouse position with smooth lerp
    const mouse = mouseRef.current;
    mouse.current.x = lerp(mouse.current.x, mouse.target.x, 0.14);
    mouse.current.y = lerp(mouse.current.y, mouse.target.y, 0.14);

    // Draw smooth anti-aliased circle with device resolution
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const radius = 24 * dpr;

    ctx.beginPath();
    ctx.arc(mouse.current.x, mouse.current.y, radius, 0, Math.PI * 2, false);
    ctx.fillStyle = isDark ? "#ffffff" : "#000000";
    ctx.fill();

    timeRef.current += 0.01;
    animationFrameRef.current = requestAnimationFrame(render);
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    mouseRef.current.target.x = (event.clientX - rect.left) * dpr;
    mouseRef.current.target.y = (event.clientY - rect.top) * dpr;
  }, []);

  const handleResize = useCallback(() => {
    resize();
  }, [resize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set CSS custom property for background color based on theme
    const updateCanvasBackground = () => {
      const isDark = document.documentElement.classList.contains('dark');
      canvas.style.setProperty('--canvas-bg', isDark ? 'black' : 'white');
    };

    // Initial setup - match the original setup() function
    updateCanvasBackground();
    resize();
    animationFrameRef.current = requestAnimationFrame(render);

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Listen for theme changes
    const observer = new MutationObserver(updateCanvasBackground);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
    };
  }, [handleResize, handleMouseMove, render, resize]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block ${className}`}
    />
  );
};

export {PixelatedCanvas};
