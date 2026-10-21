export function themeScript(): string {
  return `(function(){var t;try{var s=localStorage.getItem('theme');if(s==='light'||s==='dark')t=s}catch(e){}if(!t){try{t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){t='dark'}}document.documentElement.dataset.theme=t})();`;
}

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript() }} />;
}
