import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

// Canvas-based fluid flag — wave amplitude grows left→right so the pole stays still.
function IndianFlag() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const COLS = 120;
    const MAX_AMP = 7;      // max vertical displacement at free edge (px)
    const FREQ = 3.2;       // spatial frequency of the wave
    const SPEED = 1.8;      // animation speed

    let t = 0;
    let raf;

    // Precompute spoke endpoints for the Ashoka Chakra
    const R_INNER = 3.5, R_OUTER = 10;
    const spokes = Array.from({ length: 24 }, (_, i) => {
      const a = ((i * 360) / 24 - 90) * (Math.PI / 180);
      return [Math.cos(a), Math.sin(a)];
    });

    // dy at column fraction xf and current time t
    const dy = (xf) => xf * MAX_AMP * Math.sin(t - xf * FREQ);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.016 * SPEED;

      const bands = ['#FF9933', '#FFFFFF', '#138808'];
      const bH = H / 3;

      bands.forEach((color, b) => {
        const yBase = b * bH;
        ctx.fillStyle = color;
        ctx.beginPath();
        // Top edge left→right
        for (let i = 0; i <= COLS; i++) {
          const xf = i / COLS;
          const x = xf * W;
          const y = yBase + dy(xf);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        // Bottom edge right→left
        for (let i = COLS; i >= 0; i--) {
          const xf = i / COLS;
          ctx.lineTo(xf * W, yBase + bH + dy(xf));
        }
        ctx.closePath();
        ctx.fill();

        // Subtle shading: semi-transparent gradient that follows the wave
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.beginPath();
        for (let i = 0; i <= COLS; i++) {
          const xf = i / COLS;
          const shade = Math.sin(t - xf * FREQ + Math.PI / 2);
          const y = yBase + dy(xf) + (shade < 0 ? 0 : bH * shade * 0.5);
          i === 0 ? ctx.moveTo(xf * W, y) : ctx.lineTo(xf * W, y);
        }
        for (let i = COLS; i >= 0; i--) {
          const xf = i / COLS;
          ctx.lineTo(xf * W, yBase + bH + dy(xf));
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // Ashoka Chakra — positioned at horizontal center, wave-displaced
      const cx = W / 2;
      const cy = H / 2 + dy(0.5);
      ctx.strokeStyle = '#00008B';
      ctx.lineWidth = 1.1;

      ctx.beginPath();
      ctx.arc(cx, cy, R_OUTER, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, R_INNER, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 0.7;
      spokes.forEach(([cos, sin]) => {
        ctx.beginPath();
        ctx.moveTo(cx + cos * R_INNER, cy + sin * R_INNER);
        ctx.lineTo(cx + cos * R_OUTER, cy + sin * R_OUTER);
        ctx.stroke();
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex items-center" aria-label="Animated Indian flag">
      {/* Flagpole */}
      <div style={{ width: 5, height: 80, background: 'linear-gradient(to right,#e2b040,#8b6510)', borderRadius: 3, flexShrink: 0 }} />
      <canvas ref={canvasRef} width={120} height={80} style={{ display: 'block' }} />
    </div>
  );
}

function isTodayIndependenceDay() {
  const d = new Date();
  return d.getMonth() === 7 && d.getDate() === 15;
}

export default function IndependenceDayBanner({ campaign }) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !isTodayIndependenceDay() || !campaign) return null;

  return (
    <div
      role="banner"
      style={{ background: 'linear-gradient(135deg,#fff8f0 0%,#ffffff 50%,#f0fff4 100%)' }}
      className="relative overflow-hidden border-b border-slate-200"
    >
      {/* Top tricolor bar */}
      <div className="flex h-1">
        <div className="flex-1" style={{ background: '#FF9933' }} />
        <div className="flex-1 bg-white" />
        <div className="flex-1" style={{ background: '#138808' }} />
      </div>

      <div className="relative mx-auto flex max-w-7xl items-center gap-5 px-4 py-3 sm:px-6">
        <IndianFlag />

        <div className="min-w-0 flex-1">
          {/* Main heading — tricolor gradient text */}
          <p
            className="font-bold leading-tight"
            style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.45rem)', color: '#ea580c' }}
          >
            Happy Independence Day! 🇮🇳
          </p>
          <p className="mt-0.5 text-sm text-slate-600">
            <span className="font-semibold text-orange-700">20% off your first order — today only.</span>
            {!user && (
              <>{' '}<Link to="/login" className="underline hover:text-orange-800">Sign up to unlock your discount.</Link></>
            )}
          </p>
        </div>

        {!user ? (
          <Link
            to="/login"
            className="shrink-0 rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700"
          >
            Sign up — get 20% off
          </Link>
        ) : (
          <Link
            to="/catalog"
            className="shrink-0 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
            style={{ background: '#138808' }}
          >
            Shop now →
          </Link>
        )}

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          className="ml-1 shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-black/10 hover:text-slate-700"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      {/* Bottom tricolor bar */}
      <div className="flex h-0.5 opacity-40">
        <div className="flex-1" style={{ background: '#FF9933' }} />
        <div className="flex-1 bg-white" />
        <div className="flex-1" style={{ background: '#138808' }} />
      </div>
    </div>
  );
}
