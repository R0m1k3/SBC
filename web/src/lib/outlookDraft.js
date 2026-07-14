const LOGO_CID = 'sbc-business-club-logo';
const MIME_BOUNDARY = '----=_SBC_Outlook_Draft_Logo';

function bytesBase64(bytes) {
  let binary = '';

  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }

  return globalThis.btoa(binary);
}

function utf8Base64(value) {
  return bytesBase64(new TextEncoder().encode(String(value ?? '')));
}

function wrapBase64(value) {
  return value.match(/.{1,76}/g)?.join('\r\n') ?? '';
}

function logoSource(html) {
  return String(html).match(/\bsrc=["']([^"']*\/assets\/logo\.jpg(?:\?[^"']*)?)["']/i)?.[1] || '/assets/logo.jpg';
}

function useInlineLogo(html) {
  return String(html).replace(
    /(\bsrc\s*=\s*)(["'])(?:https?:\/\/[^"']+)?\/assets\/logo\.jpg(?:\?[^"']*)?\2/gi,
    (_match, prefix, quote) => `${prefix}${quote}cid:${LOGO_CID}${quote}`,
  );
}

export function buildOutlookDraftMime({ subject, html, logoBase64 = '' }) {
  // X-Unsent asks Outlook to open the MIME message as a message to compose.
  // Loading HTML as a real MIME body bypasses Outlook's destructive paste merge.
  if (!logoBase64) {
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

  return [
    'X-Unsent: 1',
    `Subject: =?UTF-8?B?${utf8Base64(subject)}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/related; type="text/html"; boundary="${MIME_BOUNDARY}"`,
    '',
    `--${MIME_BOUNDARY}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrapBase64(utf8Base64(useInlineLogo(html))),
    `--${MIME_BOUNDARY}`,
    'Content-Type: image/jpeg; name="logo.jpg"',
    'Content-Transfer-Encoding: base64',
    `Content-ID: <${LOGO_CID}>`,
    'Content-Disposition: inline; filename="logo.jpg"',
    '',
    wrapBase64(logoBase64),
    `--${MIME_BOUNDARY}--`,
    '',
  ].join('\r\n');
}

export async function downloadOutlookDraft({ subject, html, filename }) {
  const response = await fetch(logoSource(html), { cache: 'force-cache' });
  if (!response.ok) throw new Error("Le logo de l'e-mail n'a pas pu être chargé.");

  const logoBase64 = bytesBase64(new Uint8Array(await response.arrayBuffer()));
  const mime = buildOutlookDraftMime({ subject, html, logoBase64 });
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
