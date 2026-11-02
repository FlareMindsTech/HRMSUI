import React, { useEffect, useRef } from 'react';
import './AvengersSnapTransition.css';

/**
 * Avengers Disintegration & Quantum Reassembly Snap Animation
 * Cinematic ash dusting dissolution and quantum color transmutation.
 * Guaranteed never to freeze or leave the screen blurred.
 */
export default function AvengersSnapTransition({
  active,
  oldColors,
  newColors,
  onColorSwitch,
  onComplete,
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const safetyTimeoutRef = useRef(null);

  // Store callbacks and color props in ref so state changes during animation
  // do not re-trigger or cancel the running effect
  const propsRef = useRef({ oldColors, newColors, onColorSwitch, onComplete });
  useEffect(() => {
    propsRef.current = { oldColors, newColors, onColorSwitch, onComplete };
  });

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const appRoot = document.querySelector('.th-app-shell') || document.body;
    appRoot.classList.add('snap-dissolving');

    const currentOld = propsRef.current.oldColors || { brand: '#C7882C', ink: '#0F1F18' };
    const currentNew = propsRef.current.newColors || currentOld;

    // Create ash & quantum dust particles
    const particleCount = 380;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        originX: Math.random() * width,
        originY: Math.random() * height,
        size: Math.random() * 3.5 + 1.2,
        vx: (Math.random() * 2.5 + 1.8) * (Math.random() > 0.25 ? 1 : -0.4),
        vy: -(Math.random() * 2.8 + 1.2),
        alpha: Math.random() * 0.85 + 0.25,
        decay: Math.random() * 0.015 + 0.006,
        color: Math.random() > 0.4 ? currentOld.brand : currentOld.ink,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.08,
      });
    }

    const startTime = performance.now();
    let colorSwitched = false;
    let finished = false;

    const cleanupAnimation = () => {
      if (finished) return;
      finished = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      appRoot.classList.remove('snap-dissolving');
      appRoot.classList.remove('snap-reassembling');
      if (ctx) ctx.clearRect(0, 0, width, height);
      if (propsRef.current.onComplete) {
        propsRef.current.onComplete();
      }
    };

    // Safety timeout: Guaranteed completion after 1450ms even if RAF drops
    safetyTimeoutRef.current = setTimeout(() => {
      if (!colorSwitched && propsRef.current.onColorSwitch) {
        propsRef.current.onColorSwitch();
      }
      cleanupAnimation();
    }, 1450);

    const animate = (currentTime) => {
      if (finished) return;
      const elapsed = currentTime - startTime;
      ctx.clearRect(0, 0, width, height);

      // Phase 1: Disintegration (0 - 620ms)
      if (elapsed < 620) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx + Math.sin(p.angle) * 0.8;
          p.y += p.vy;
          p.angle += p.spin;
          p.alpha = Math.max(0, p.alpha - p.decay);

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      // Midpoint: Color Transmutation (620ms)
      else if (elapsed >= 620 && !colorSwitched) {
        colorSwitched = true;
        if (propsRef.current.onColorSwitch) {
          propsRef.current.onColorSwitch();
        }

        // Switch screen to quantum reassembly mode
        appRoot.classList.remove('snap-dissolving');
        appRoot.classList.add('snap-reassembling');

        // Respawn particles from edges inward with the NEW brand and ink colors
        const activeNew = propsRef.current.newColors || currentNew;
        particles.forEach((p) => {
          const edge = Math.floor(Math.random() * 4);
          if (edge === 0) { p.x = Math.random() * width; p.y = -20; }
          else if (edge === 1) { p.x = width + 20; p.y = Math.random() * height; }
          else if (edge === 2) { p.x = Math.random() * width; p.y = height + 20; }
          else { p.x = -20; p.y = Math.random() * height; }

          p.color = Math.random() > 0.35 ? activeNew.brand : activeNew.ink;
          p.alpha = 0.95;
          p.size = Math.random() * 3 + 1.5;
        });
      }
      // Phase 2: Quantum Reassembly (620ms - 1250ms)
      else if (elapsed < 1250) {
        const progress = (elapsed - 620) / 630;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += (p.originX - p.x) * 0.14;
          p.y += (p.originY - p.y) * 0.14;
          p.alpha = Math.max(0, 1 - progress * 1.15);

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      // Phase 3: Completion (1250ms+)
      else {
        cleanupAnimation();
        return;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      appRoot.classList.remove('snap-dissolving');
      appRoot.classList.remove('snap-reassembling');
    };
  }, [active]); // ONLY depend on active

  if (!active) return null;

  return (
    <div className="avengers-snap-overlay" aria-hidden="true">
      <div className="avengers-shockwave" />
      <canvas ref={canvasRef} className="avengers-snap-canvas" />
    </div>
  );
}

