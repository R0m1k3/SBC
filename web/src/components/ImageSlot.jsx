import { useRef, useState } from 'react';
import { api } from '../lib/api.js';

// Real replacement for the mock's <image-slot>: click or drop an image,
// it is uploaded to `endpoint` and the stored path is displayed.
// `disabled` shows the placeholder without any upload interaction — used
// when the endpoint needs an id that doesn't exist yet (e.g. an entity
// that must be saved first).
export default function ImageSlot({ endpoint, value, onUploaded, placeholder, circle, disabled }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async (file) => {
    if (!file || disabled) return;
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
      style={{ cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1 }}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => !disabled && e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (!disabled) send(e.dataTransfer.files?.[0]);
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      {value && <img src={value} alt="" />}
      {!value && <span>{busy ? 'Envoi…' : error || placeholder}</span>}
      {!disabled && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => send(e.target.files?.[0])}
        />
      )}
    </div>
  );
}
