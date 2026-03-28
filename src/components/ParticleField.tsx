import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  speed: number;
  color: string;
  emoji: string;
  rotation: number;
  rotationSpeed: number;
}

const emojis = ['⭐', '💖', '🌟', '✨', '🎈', '🌈', '☀️', '🦋', '🌸', '🎨'];
const colors = [
  'rgba(249, 115, 22, ', // orange
  'rgba(250, 204, 21, ', // yellow
  'rgba(34, 197, 94, ',  // green
  'rgba(59, 130, 246, ', // blue
  'rgba(236, 72, 153, ', // pink
  'rgba(168, 85, 247, ', // purple
];

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number | undefined>(undefined);
  const frameCountRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check if touch device - reduce particles
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    const particleCount = isTouchDevice ? 12 : 25;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles with fun emojis and colors
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8 - 0.3, // Slight upward drift
      size: Math.random() * 16 + 12,
      opacity: Math.random() * 0.4 + 0.5,
      speed: Math.random() * 0.5 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const animate = () => {
      frameCountRef.current++;
      
      // Render every 2nd frame for performance
      if (frameCountRef.current % 2 === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particlesRef.current.forEach((particle, i) => {
          // Update rotation
          particle.rotation += particle.rotationSpeed;
          
          // Mouse attraction - particles gently follow cursor
          if (i % 3 === 0) {
            const dx = mouseRef.current.x - particle.x;
            const dy = mouseRef.current.y - particle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 200 && dist > 0) {
              const force = (200 - dist) / 200;
              particle.vx += (dx / dist) * force * 0.015;
              particle.vy += (dy / dist) * force * 0.015;
            }
          }

          // Update position
          particle.x += particle.vx * particle.speed;
          particle.y += particle.vy * particle.speed;

          // Damping
          particle.vx *= 0.995;
          particle.vy *= 0.995;

          // Random drift with upward tendency
          particle.vx += (Math.random() - 0.5) * 0.04;
          particle.vy += (Math.random() - 0.5) * 0.04 - 0.008;

          // Wrap around screen
          if (particle.x < -30) particle.x = canvas.width + 30;
          if (particle.x > canvas.width + 30) particle.x = -30;
          if (particle.y < -30) particle.y = canvas.height + 30;
          if (particle.y > canvas.height + 30) particle.y = -30;

          // Draw emoji with rotation
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate((particle.rotation * Math.PI) / 180);
          ctx.font = `${particle.size}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = particle.opacity;
          ctx.fillText(particle.emoji, 0, 0);
          ctx.restore();
          
          // Draw glow effect
          const glowSize = particle.size * 1.5;
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, glowSize
          );
          gradient.addColorStop(0, particle.color + '0.2)');
          gradient.addColorStop(1, particle.color + '0)');
          
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
    />
  );
}
