import { useRef, useState } from 'react';
import { api } from '../lib/api.js';

// Real replacement for the mock's <image-slot>: click or drop an image,
// it is uploaded to `endpoint` and the stored path is displayed.
export default function ImageSlot({ endpoint, value, onUploaded, placeholder, circle }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async (file) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const d = await api.upload(endpoint, file);
      onUploaded?.(d.path);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`image-slot${circle ? ' circle' : ''}`}
      style={{ cursor: 'pointer' }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        send(e.dataTransfer.files?.[0]);
      }}
      role="button"
      tabIndex={0}
    >
      {value && <img src={value} alt="" />}
      {!value && <span>{busy ? 'Envoi…' : error || placeholder}</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => send(e.target.files?.[0])}
      />
    </div>
  );
}
