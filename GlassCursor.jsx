import { useEffect, useRef } from "react";

/**
 * GlassCursor — Inspired by React Bits Pro (https://pro.reactbits.dev/docs/components/glass-cursor)
 * 
 * GPU-accelerated WebGL liquid glass lens cursor with:
 * - Real optical refraction & chromatic aberration
 * - Dynamic metaball trail that deforms organically along movement
 * - Multi-tap blur spread and specular lighting highlights
 * - Fresnel border glow / rim shine
 * - Seamless reveal of the secondary image (messy room) through the lens
 * - Zero interference with user clicks, links, or form controls
 */

const VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vUv.y = 1.0 - vUv.y; // Match screen coordinates
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uTexture;
uniform sampler2D uRevealTexture;

#define MAX_TRAIL 40
uniform vec2 uTrail[MAX_TRAIL];
uniform int uTrailCount;

uniform float uBlobSize;
uniform float uTailFade;
uniform float uThreshold;
uniform float uRefraction;
uniform float uBlurSpread;
uniform float uBorderGlow;
uniform float uSpecularGain;
uniform float uBlobWarpAmount;
uniform float uBlobWarpScale;
uniform float uOpacity;
uniform float uGlobalAlpha;

// Calculate organic metaball density field from trail points
float getField(vec2 uv, vec2 aspect) {
  float field = 0.0;
  
  // Dynamic noise warp for fluid liquid appearance
  vec2 warp = vec2(
    sin(uv.y * uBlobWarpScale * 3.0 + uTime * 2.0),
    cos(uv.x * uBlobWarpScale * 3.0 + uTime * 2.2)
  ) * (uBlobWarpAmount * 0.0008);
  
  vec2 warpedUv = uv + warp;

  for (int i = 0; i < MAX_TRAIL; i++) {
    if (i >= uTrailCount) break;
    float t = float(i) / float(uTrailCount);
    float fade = pow(1.0 - t, uTailFade);
    float radius = uBlobSize * (0.45 + 0.55 * fade);
    
    vec2 diff = (warpedUv - uTrail[i]) * aspect;
    float dist = length(diff);
    
    if (dist < radius * 3.2) {
      float d = dist / radius;
      field += exp(-d * d * 1.8) * fade;
    }
  }
  return field;
}

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  
  // Base primary image
  vec4 baseCol = texture(uTexture, vUv);
  
  if (uGlobalAlpha <= 0.001 || uTrailCount == 0) {
    fragColor = baseCol;
    return;
  }

  // Calculate field gradient for normal vector computation
  vec2 eps = vec2(1.5 / uResolution.x, 1.5 / uResolution.y);
  float fCenter = getField(vUv, aspect);
  float fRight  = getField(vUv + vec2(eps.x, 0.0), aspect);
  float fLeft   = getField(vUv - vec2(eps.x, 0.0), aspect);
  float fTop    = getField(vUv + vec2(0.0, eps.y), aspect);
  float fBottom = getField(vUv - vec2(0.0, eps.y), aspect);

  vec2 grad = vec2(fRight - fLeft, fTop - fBottom);

  // Smooth lens mask along threshold
  float edge = 0.07;
  float mask = smoothstep(uThreshold - edge, uThreshold + edge, fCenter);

  if (mask <= 0.001) {
    fragColor = baseCol;
    return;
  }

  // 3D Normal of the liquid lens surface
  vec3 N = normalize(vec3(-grad * 14.0, 1.0));

  // Optical refraction vector with chromatic dispersion (RGB offset)
  vec2 refr = -grad * uRefraction * 0.16;
  
  vec2 uvR = clamp(vUv + refr * 1.04, 0.0, 1.0);
  vec2 uvG = clamp(vUv + refr * 1.00, 0.0, 1.0);
  vec2 uvB = clamp(vUv + refr * 0.96, 0.0, 1.0);

  vec4 refColor;
  refColor.r = texture(uRevealTexture, uvR).r;
  refColor.g = texture(uRevealTexture, uvG).g;
  refColor.b = texture(uRevealTexture, uvB).b;
  refColor.a = 1.0;

  // Blur spread multi-sampling
  if (uBlurSpread > 0.05) {
    vec4 blurCol = vec4(0.0);
    float b = uBlurSpread * 0.0035;
    blurCol += texture(uRevealTexture, uvG + vec2( b,  b));
    blurCol += texture(uRevealTexture, uvG + vec2(-b,  b));
    blurCol += texture(uRevealTexture, uvG + vec2( b, -b));
    blurCol += texture(uRevealTexture, uvG + vec2(-b, -b));
    refColor = mix(refColor, blurCol * 0.25, 0.35);
  }

  // Lighting: Specular reflection highlight
  vec3 lightDir = normalize(vec3(-0.35, 0.55, 0.75));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 halfVec = normalize(lightDir + viewDir);
  float spec = pow(max(dot(N, halfVec), 0.0), 28.0) * uSpecularGain * 2.8;

  // Fresnel rim / border glow
  float fresnel = pow(1.0 - max(dot(N, viewDir), 0.0), 3.0);
  float rim = fresnel * uBorderGlow * 3.5;

  // Final lens color
  vec3 glassColor = refColor.rgb * 1.04 + vec3(spec) + vec3(rim);

  // Composite over base scene
  float totalAlpha = mask * uOpacity * uGlobalAlpha;
  vec3 finalColor = mix(baseCol.rgb, glassColor, totalAlpha);

  fragColor = vec4(finalColor, 1.0);
}
`;

export default function GlassCursor({
  dampening = 0.05,
  blobSize = 0.055,
  trailLength = 36,
  tailFade = 0.3,
  threshold = 0.6,
  refraction = 0.32,
  blurSpread = 0.3,
  borderGlow = 0.18,
  specularGain = 0.24,
  blobWarpAmount = 25,
  blobWarpScale = 5,
  opacity = 1,
  primarySrc = "/images/dog-clean.jpg",
  revealSrc = "/images/dog-messy.jpg",
  areaRef,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Respect prefers-reduced-motion or touch-only devices
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || calm.matches) return;

    const canvas = canvasRef.current;
    const area = areaRef?.current;
    if (!canvas || !area) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    // Helper: compile shader
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vert = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const frag = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vert || !frag) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // Quad geometry (full screen triangle strip)
    const quadVao = gl.createVertexArray();
    const quadBuf = gl.createBuffer();
    gl.bindVertexArray(quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, "aPosition");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uLocs = {
      resolution: gl.getUniformLocation(prog, "uResolution"),
      time: gl.getUniformLocation(prog, "uTime"),
      texture: gl.getUniformLocation(prog, "uTexture"),
      revealTexture: gl.getUniformLocation(prog, "uRevealTexture"),
      trail: gl.getUniformLocation(prog, "uTrail"),
      trailCount: gl.getUniformLocation(prog, "uTrailCount"),
      blobSize: gl.getUniformLocation(prog, "uBlobSize"),
      tailFade: gl.getUniformLocation(prog, "uTailFade"),
      threshold: gl.getUniformLocation(prog, "uThreshold"),
      refraction: gl.getUniformLocation(prog, "uRefraction"),
      blurSpread: gl.getUniformLocation(prog, "uBlurSpread"),
      borderGlow: gl.getUniformLocation(prog, "uBorderGlow"),
      specularGain: gl.getUniformLocation(prog, "uSpecularGain"),
      blobWarpAmount: gl.getUniformLocation(prog, "uBlobWarpAmount"),
      blobWarpScale: gl.getUniformLocation(prog, "uBlobWarpScale"),
      opacity: gl.getUniformLocation(prog, "uOpacity"),
      globalAlpha: gl.getUniformLocation(prog, "uGlobalAlpha"),
    };

    // Textures setup
    const createTex = (src, unit) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      // 1x1 placeholder
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([30, 26, 23, 255])
      );

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      };
      img.src = src;
      return tex;
    };

    const primaryTex = createTex(primarySrc, 0);
    const revealTex = createTex(revealSrc, 1);

    gl.uniform1i(uLocs.texture, 0);
    gl.uniform1i(uLocs.revealTexture, 1);

    // Trail points history
    const MAX_TRAIL = 40;
    const count = Math.min(trailLength, MAX_TRAIL);
    const trailPoints = [];
    for (let i = 0; i < count; i++) {
      trailPoints.push({ x: 0.5, y: 0.5 });
    }
    const trailFlat = new Float32Array(MAX_TRAIL * 2);

    let mouse = { x: 0.5, y: 0.5 };
    let head = { x: 0.5, y: 0.5 };
    let isInside = false;
    let globalAlpha = 0;
    let animId = 0;
    let startTime = performance.now();

    // Canvas resize handler
    const resize = () => {
      const rect = area.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    // Mouse listeners
    const onMove = (e) => {
      const rect = area.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = (e.clientY - rect.top) / rect.height;
      if (!isInside) {
        isInside = true;
        head.x = mouse.x;
        head.y = mouse.y;
        for (let i = 0; i < count; i++) {
          trailPoints[i].x = mouse.x;
          trailPoints[i].y = mouse.y;
        }
      }
    };

    const onEnter = (e) => {
      onMove(e);
      isInside = true;
    };

    const onLeave = () => {
      isInside = false;
    };

    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerenter", onEnter);
    area.addEventListener("pointerleave", onLeave);

    // Animation Loop
    const render = () => {
      const now = performance.now();
      const time = (now - startTime) * 0.001;

      // Dampened head movement
      const follow = 1.0 - Math.min(Math.max(dampening, 0.0), 0.5);
      head.x += (mouse.x - head.x) * follow * 0.8;
      head.y += (mouse.y - head.y) * follow * 0.8;

      // Shift trail points with organic fluid propagation
      trailPoints[0].x = head.x;
      trailPoints[0].y = head.y;
      for (let i = count - 1; i > 0; i--) {
        const pull = 0.55;
        trailPoints[i].x += (trailPoints[i - 1].x - trailPoints[i].x) * pull;
        trailPoints[i].y += (trailPoints[i - 1].y - trailPoints[i].y) * pull;
      }

      // Smooth fade in / out
      if (isInside) {
        globalAlpha += (1.0 - globalAlpha) * 0.12;
      } else {
        globalAlpha += (0.0 - globalAlpha) * 0.08;
      }

      // Pack trail for GLSL
      for (let i = 0; i < MAX_TRAIL; i++) {
        if (i < count) {
          trailFlat[i * 2] = trailPoints[i].x;
          trailFlat[i * 2 + 1] = trailPoints[i].y;
        } else {
          trailFlat[i * 2] = head.x;
          trailFlat[i * 2 + 1] = head.y;
        }
      }

      // Pass uniforms
      gl.uniform2f(uLocs.resolution, canvas.width, canvas.height);
      gl.uniform1f(uLocs.time, time);
      gl.uniform2fv(uLocs.trail, trailFlat);
      gl.uniform1i(uLocs.trailCount, count);
      gl.uniform1f(uLocs.blobSize, blobSize);
      gl.uniform1f(uLocs.tailFade, tailFade);
      gl.uniform1f(uLocs.threshold, threshold);
      gl.uniform1f(uLocs.refraction, refraction);
      gl.uniform1f(uLocs.blurSpread, blurSpread);
      gl.uniform1f(uLocs.borderGlow, borderGlow);
      gl.uniform1f(uLocs.specularGain, specularGain);
      gl.uniform1f(uLocs.blobWarpAmount, blobWarpAmount);
      gl.uniform1f(uLocs.blobWarpScale, blobWarpScale);
      gl.uniform1f(uLocs.opacity, opacity);
      gl.uniform1f(uLocs.globalAlpha, globalAlpha);

      // Draw full screen quad
      gl.bindVertexArray(quadVao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // Cleanup resources
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerenter", onEnter);
      area.removeEventListener("pointerleave", onLeave);
      gl.deleteTexture(primaryTex);
      gl.deleteTexture(revealTex);
      gl.deleteBuffer(quadBuf);
      gl.deleteVertexArray(quadVao);
      gl.deleteProgram(prog);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
    };
  }, [
    dampening,
    blobSize,
    trailLength,
    tailFade,
    threshold,
    refraction,
    blurSpread,
    borderGlow,
    specularGain,
    blobWarpAmount,
    blobWarpScale,
    opacity,
    primarySrc,
    revealSrc,
    areaRef,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="glass-cursor-webgl-canvas"
      aria-hidden="true"
    />
  );
}
