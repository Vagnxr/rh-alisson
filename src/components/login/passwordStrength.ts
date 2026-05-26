export function passwordStrength(p: string) {
  if (!p) return { score: 0, label: '', cls: '' };
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^\w]/.test(p) || p.length >= 12) s++;
  const map = [
    { label: 'Muito fraca', cls: 's1' },
    { label: 'Fraca', cls: 's1' },
    { label: 'Razoável', cls: 's2' },
    { label: 'Boa', cls: 's3' },
    { label: 'Forte', cls: 's4' },
  ];
  return { score: s, ...map[s] };
}
