/** The window slot the inline early-start script fills and `loadPagefind` empties. */
export const EARLY_KEY = "__pagefindEarly";

/**
 * Inline script for the search page. Only a deep link (`?q=` with at least `minChars` characters)
 * searches during page load, so only then does it start the Pagefind runtime (script and `init`,
 * which fetches the entry file, metadata and WASM) at once, instead of after the app bundle has
 * loaded and hydrated. That takes the bundle and hydration out of the request chain. Idle visits do
 * nothing. A failure resolves to null and `loadPagefind` then loads the normal way.
 */
export function earlyStartScript(minChars: number): string {
  return `(function(){var q=new URLSearchParams(location.search).get("q");if(!q||q.trim().length<${minChars})return;window.${EARLY_KEY}=import("/pagefind/pagefind.js").then(function(p){return p.init?p.init().then(function(){return p}):p}).catch(function(){return null})})()`;
}
