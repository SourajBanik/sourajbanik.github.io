/* Run before the stylesheets to restore the theme before first paint.
   Dark is the default; never require browser storage to make the site usable. */
(() => {
  'use strict';
  let theme = 'dark';
  try {
    const saved = window.localStorage.getItem('souraj-portfolio-theme');
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch { /* Storage can be unavailable in private or local-file contexts. */ }
  document.documentElement.dataset.theme = theme;
  const color = document.querySelector('meta[name="theme-color"]');
  if (color) color.content = theme === 'light' ? '#f5f8fc' : '#090d16';
})();
