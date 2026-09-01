const STORAGE_KEY = 'spmc-theme';
type Theme = 'light' | 'dark' | 'system';

function apply(theme: Theme) {
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system';
const theme = ref<Theme>(stored);
apply(theme.value);

export function useTheme() {
  function setTheme(next: Theme) {
    theme.value = next;
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
  }
  return { theme, setTheme };
}
