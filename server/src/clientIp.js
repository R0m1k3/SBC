export function normalizeClientIp(input) {
  let ip = String(input ?? '').split(',')[0].trim();
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  if (ip.startsWith('[') && ip.includes(']')) ip = ip.slice(1, ip.indexOf(']'));
  return ip.slice(0, 64);
}

export function isPrivateClientIp(input) {
  const ip = normalizeClientIp(input).toLowerCase();
  if (!ip) return false;

  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    return parts[0] === 10
      || parts[0] === 127
      || (parts[0] === 169 && parts[1] === 254)
      || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
      || (parts[0] === 192 && parts[1] === 168);
  }

  return ip === '::1'
    || ip === '::'
    || ip.startsWith('fc')
    || ip.startsWith('fd')
    || /^fe[89ab]/.test(ip);
}

export function requestClientIp(req) {
  return normalizeClientIp(req.ip || req.socket?.remoteAddress);
}
