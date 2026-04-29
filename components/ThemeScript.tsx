import { clubThemes, getDefaultThemeKeyForClub } from '@/lib/club-branding'

export function ThemeScript({
  clubId,
  clubName,
  preferredThemeKey,
}: {
  clubId: string
  clubName: string
  preferredThemeKey?: string
}) {
  const defaultTheme = preferredThemeKey ?? getDefaultThemeKeyForClub(clubName)
  const storageKey = `club-theme:${clubId}`
  const themeMap = Object.fromEntries(
    clubThemes.map((theme) => [theme.key, theme.vars])
  )

  const script = `
    (function () {
      var storageKey = '${storageKey}';
      var key = localStorage.getItem(storageKey) || '${defaultTheme}';
      var themes = ${JSON.stringify(themeMap)};
      var vars = themes[key] || themes['${defaultTheme}'];
      document.documentElement.dataset.theme = key;
      if (vars) {
        Object.keys(vars).forEach(function(name) {
          document.documentElement.style.setProperty(name, vars[name]);
        });
      }
    })();
  `

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
