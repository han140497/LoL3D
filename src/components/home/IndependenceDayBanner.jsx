import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

function IndianFlag({ width = 110, height = 73 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const COLS = 100;
    const MAX_AMP = H * 0.09;
    const FREQ = 3.2;
    const SPEED = 1.8;
    let t = 0;
    let raf;

    const R_INNER = H * 0.044;
    const R_OUTER = H * 0.125;
    const spokes = Array.from({ length: 24 }, (_, i) => {
      const a = ((i * 360) / 24 - 90) * (Math.PI / 180);
      return [Math.cos(a), Math.sin(a)];
    });

    const dy = (xf) => xf * MAX_AMP * Math.sin(t - xf * FREQ);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.016 * SPEED;
      const bH = H / 3;

      ['#FF9933', '#FFFFFF', '#138808'].forEach((color, b) => {
        const yBase = b * bH;
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i <= COLS; i++) {
          const xf = i / COLS;
          i === 0 ? ctx.moveTo(xf * W, yBase + dy(xf)) : ctx.lineTo(xf * W, yBase + dy(xf));
        }
        for (let i = COLS; i >= 0; i--) {
          const xf = i / COLS;
          ctx.lineTo(xf * W, yBase + bH + dy(xf));
        }
        ctx.closePath();
        ctx.fill();

        // Cloth shading
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.beginPath();
        for (let i = 0; i <= COLS; i++) {
          const xf = i / COLS;
          const s = Math.sin(t - xf * FREQ + Math.PI / 2);
          const y = yBase + dy(xf) + (s < 0 ? 0 : bH * s * 0.5);
          i === 0 ? ctx.moveTo(xf * W, y) : ctx.lineTo(xf * W, y);
        }
        for (let i = COLS; i >= 0; i--) {
          ctx.lineTo((i / COLS) * W, yBase + bH + dy(i / COLS));
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      const cx = W / 2;
      const cy = H / 2 + dy(0.5);
      ctx.strokeStyle = '#00008B';
      ctx.lineWidth = H * 0.014;
      ctx.beginPath(); ctx.arc(cx, cy, R_OUTER, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R_INNER, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = H * 0.009;
      spokes.forEach(([c, s]) => {
        ctx.beginPath();
        ctx.moveTo(cx + c * R_INNER, cy + s * R_INNER);
        ctx.lineTo(cx + c * R_OUTER, cy + s * R_OUTER);
        ctx.stroke();
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex shrink-0 items-center" aria-label="Animated Indian flag">
      <div style={{
        width: Math.max(3, width * 0.04),
        height,
        background: 'linear-gradient(to right,#e2b040,#8b6510)',
        borderRadius: 3,
      }} />
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
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

      <div className="relative mx-auto flex max-w-7xl items-center gap-3 px-3 py-2.5 sm:gap-5 sm:px-6 sm:py-3">
        {/* Flag — smaller on mobile */}
        <div className="block sm:hidden"><IndianFlag width={72} height={48} /></div>
        <div className="hidden sm:block"><IndianFlag width={110} height={73} /></div>

        <div className="min-w-0 flex-1">
          <p
            className="font-bold leading-tight"
            style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.25rem)', color: '#ea580c' }}
          >
            Happy Independence Day! 🇮🇳
          </p>
          <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
            <span className="font-semibold text-orange-700">20% off your first order — today only.</span>
            {!user && (
              <>
                {' '}
                {/* Inline link on mobile, hidden on desktop (button handles it there) */}
                <Link to="/login" className="underline hover:text-orange-800 sm:hidden">
                  Sign up →
                </Link>
                <Link to="/login" className="hidden underline hover:text-orange-800 sm:inline">
                  Sign up to unlock your discount.
                </Link>
              </>
            )}
          </p>
        </div>

        {/* CTA button — desktop only */}
        {!user ? (
          <Link
            to="/login"
            className="hidden shrink-0 rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 sm:block"
          >
            Sign up — get 20% off
          </Link>
        ) : (
          <Link
            to="/catalog"
            className="hidden shrink-0 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors sm:block"
            style={{ background: '#138808' }}
          >
            Shop now →
          </Link>
        )}

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-black/10 hover:text-slate-700"
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
