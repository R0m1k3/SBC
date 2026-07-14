function utf8Base64(value) {
  const bytes = new TextEncoder().encode(String(value ?? ''));
  let binary = '';

  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }

  return globalThis.btoa(binary);
}

function wrapBase64(value) {
  return value.match(/.{1,76}/g)?.join('\r\n') ?? '';
}

export function buildOutlookDraftMime({ subject, html }) {
  // X-Unsent asks Outlook to open the MIME message as a message to compose.
  // Loading HTML as a real MIME body bypasses Outlook's destructive paste merge.
  return [
    'X-Unsent: 1',
    `Subject: =?UTF-8?B?${utf8Base64(subject)}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrapBase64(utf8Base64(html)),
    '',
  ].join('\r\n');
}

export function downloadOutlookDraft({ subject, html, filename }) {
  const mime = buildOutlookDraftMime({ subject, html });
  const blob = new Blob([mime], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
