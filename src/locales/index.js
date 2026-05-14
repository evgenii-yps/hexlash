// English-only i18n (Phase 1.5c — multi-locale support removed).
//
// API surface preserved verbatim to keep blast radius zero:
//   - `t` stays a computed ref returning the en data object. Templates
//     access t.section.key (auto-unwrap); script reads t.value.section.key.
//   - `interpolate(str, params)` unchanged signature.
//
// What was removed:
//   - 10 locale data imports (ru/de/es/fr/pt/ar/hi/ja/ko/zh)
//   - help/rules locale JSONs (10 rules + 1 help — only en kept)
//   - `languages` map / `currentLanguage` ref / `STORAGE_KEY`
//   - `setLanguage(lang)`, `getLanguage()`, `availableLanguages`
//   - `detectBrowserLanguage()` (navigator.language detection)
//   - `ruCountRule()` (0 callsites verified — dead code)
//
// `t` is intentionally kept as `computed(() => ...)` rather than a plain
// object so existing call sites using `t.value.x` (script) and `t.x`
// (template) keep working without per-callsite migration. Vue's template
// auto-unwrap handles both cases.

import { computed } from 'vue'

import en from './en.js'
import enHelp from './pages/help/en.json'
import enRules from './pages/rules/en.json'

const data = {
  ...en,
  pages: {
    help: enHelp.pages.help,
    rules: enRules.pages.rules,
  },
}

export const t = computed(() => data)

export function interpolate(str, params) {
  if (!str || !params) return str
  return Object.entries(params).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), str)
}
