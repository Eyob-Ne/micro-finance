export const isValidPhone = (v) => /^(\+?251|0)?9\d{8}$/.test(v || '');
export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
export const isValidNationalId = (v) => /^[A-Za-z0-9-]{5,30}$/.test(v || '');
export const isValidPassword = (v) => typeof v === 'string' && v.length >= 6 && v.length <= 72;
export const isValidAmount = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && Math.round(n * 100) === n * 100;
};
export const isAtLeast18 = (dob) => {
  if (!dob) return false;
  const b = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 18;
};
