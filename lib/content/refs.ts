export type Ref = { id: string; locator?: string; raw: string };

export function extractRefs(body: string): Ref[] {
  const refs: Ref[] = [];
  for (const m of body.matchAll(/\[(S\d+)(?:\s+([^\]]+))?\]/g)) {
    const ref: Ref = { id: m[1], raw: m[0] };
    if (m[2] !== undefined) ref.locator = m[2].trim();
    refs.push(ref);
  }
  return refs;
}
