// Applies the saved/system theme before mount, on every load, regardless of
// which route (and therefore which lazy chunk) happens to call useTheme()
// first — a composable that applies a side effect only runs when its module
// is first imported, so gating it behind a specific page would activate it
// inconsistently depending on navigation.
export default defineNuxtPlugin(() => {
  useTheme();
});
