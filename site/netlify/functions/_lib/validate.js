export const isUuidV4 = (v) => {
  if (typeof v !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
};

export const normalizeExpiryDays = (v, { min = 1, max = 365, fallback = 21 } = {}) => {
  const n = Number.parseInt(String(v || ''), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};
