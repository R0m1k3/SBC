import { useEffect, useRef, useState } from 'react';

// Self-contained signature pad: draw with mouse or finger, clear, and get
// the drawing as a PNG data URL via onChange. Kept at a small fixed size so
// the exported PNG stays well under the request body limit.
const W = 500;
const H = 160;

export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1B1B1B';
  }, []);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: (p.clientX - rect.left) * (W / rect.width), y: (p.clientY - rect.top) * (H / rect.height) };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (empty) setEmpty(false);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange?.(empty ? '' : canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    canvasRef.current.getContext('2d').clearRect(0, 0, W, H);
    setEmpty(true);
    onChange?.('');
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, height: 'auto', aspectRatio: `${W} / ${H}`, border: '1px solid var(--input-border)', borderRadius: 6, background: '#fff', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <span style={{ fontSize: 11.5, color: 'var(--gray-light)' }}>Signez ci-dessus avec la souris ou le doigt.</span>
        <button type="button" className="btn-link-gray" style={{ fontSize: 12.5 }} onClick={clear}>Effacer</button>
      </div>
    </div>
  );
}
