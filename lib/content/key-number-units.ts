/** Unit tokens allowed inside keyNumbers values. Values are shared by both locales, so no prose. */
export const KEY_NUMBER_UNITS: readonly string[] = [
  'ns', 'µs', 'μs', 'us', 'ms', 's', 'min', 'h', 'd', 'w', 'mo', 'y',
  'k', 'K', 'M', 'B', 'T',
  'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'KiB', 'MiB', 'GiB', 'TiB',
  'bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps',
  'Hz', 'kHz', 'MHz', 'GHz',
  'x', 'p50', 'p75', 'p90', 'p95', 'p99', 'p999',
  'req', 'msg', 'rows', 'rps', 'qps', 'QPS', 'RPS', 'TPS', 'IOPS', 'ops',
  'DAU', 'MAU', 'CPU', 'GPU', 'vCPU', 'RAM',
];

const UNITS = new Set(KEY_NUMBER_UNITS);

/** Letter tokens in `value` that are not allowed units (case-sensitive). */
export function wordsIn(value: string): string[] {
  return (value.match(/\p{L}[\p{L}\p{N}]*/gu) ?? []).filter((t) => !UNITS.has(t));
}
