export function computeNextDue(effectiveDate, cycleMonths) {
  if (!effectiveDate) return '';
  const d = new Date(effectiveDate + 'T00:00:00');
  d.setMonth(d.getMonth() + (cycleMonths || 12));
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
