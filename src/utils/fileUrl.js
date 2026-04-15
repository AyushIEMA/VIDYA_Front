export function normalizeFileUrl(url) {
  const u = (url || '').toString().trim();
  if (!u) return '';
  if (u.startsWith('//')) return `https:${u}`;
  if (u.startsWith('http://')) return `https://${u.slice('http://'.length)}`;
  return u;
}

