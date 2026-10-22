/**
 * Publication timezone is Asia/Ho_Chi_Minh (UTC+07:00, no DST), so a
 * date-only value is anchored at local midnight with a fixed offset.
 */
export function isoAtPublication(day: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error(`isoAtPublication: expected YYYY-MM-DD, got "${day}"`);
  return `${day}T00:00:00+07:00`;
}
