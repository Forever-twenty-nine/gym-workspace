
// src/theme.ts
export function applyInitialTheme() {
  const stored = localStorage.getItem('dark-mode');
  const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const enableDark = stored !== null ? stored === 'true' : prefers;
  document.documentElement.classList.toggle('dark', enableDark);
}
