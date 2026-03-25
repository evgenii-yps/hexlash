import { ref, computed } from 'vue'

import en from './en.js'
import ru from './ru.js'
import de from './de.js'
import es from './es.js'
import fr from './fr.js'
import pt from './pt.js'
import ar from './ar.js'
import hi from './hi.js'
import ja from './ja.js'
import ko from './ko.js'
import zh from './zh.js'

import enHelp from './pages/help/en.json'
import enRules from './pages/rules/en.json'
import ruHelp from './pages/help/ru.json'
import ruRules from './pages/rules/ru.json'
import esRules from './pages/rules/es.json'
import zhRules from './pages/rules/zh.json'
import frRules from './pages/rules/fr.json'
import deRules from './pages/rules/de.json'
import ptRules from './pages/rules/pt.json'
import arRules from './pages/rules/ar.json'
import hiRules from './pages/rules/hi.json'
import jaRules from './pages/rules/ja.json'
import koRules from './pages/rules/ko.json'

const languages = {
  en: { ...en, pages: { help: enHelp.pages.help, rules: enRules.pages.rules } },
  ru: { ...ru, pages: { help: ruHelp.pages.help, rules: ruRules.pages.rules } },
  de: { ...de, pages: { help: enHelp.pages.help, rules: deRules.pages.rules } },
  es: { ...es, pages: { help: enHelp.pages.help, rules: esRules.pages.rules } },
  fr: { ...fr, pages: { help: enHelp.pages.help, rules: frRules.pages.rules } },
  pt: { ...pt, pages: { help: enHelp.pages.help, rules: ptRules.pages.rules } },
  ar: { ...ar, pages: { help: enHelp.pages.help, rules: arRules.pages.rules } },
  hi: { ...hi, pages: { help: enHelp.pages.help, rules: hiRules.pages.rules } },
  ja: { ...ja, pages: { help: enHelp.pages.help, rules: jaRules.pages.rules } },
  ko: { ...ko, pages: { help: enHelp.pages.help, rules: koRules.pages.rules } },
  zh: { ...zh, pages: { help: enHelp.pages.help, rules: zhRules.pages.rules } },
}

const STORAGE_KEY = 'hexlash-language'

function detectBrowserLanguage() {
  const browserLang = navigator.language.split('-')[0]
  return languages[browserLang] ? browserLang : 'en'
}

const savedLang = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('preferredLanguage')
const currentLanguage = ref(savedLang && languages[savedLang] ? savedLang : detectBrowserLanguage())

export const t = computed(() => languages[currentLanguage.value] || languages.en)

export function setLanguage(lang) {
  if (languages[lang]) {
    currentLanguage.value = lang
    localStorage.setItem(STORAGE_KEY, lang)
  }
}

export function getLanguage() {
  return currentLanguage.value
}

export const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
]

export function interpolate(str, params) {
  if (!str || !params) return str
  return Object.entries(params).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), str)
}

export function ruCountRule(choice, choicesLength) {
  if (choice === 0) return 0
  const teen = choice > 10 && choice < 20
  const endsWithOne = choice % 10 === 1
  if (!teen && endsWithOne) return 1
  if (!teen && choice % 10 >= 2 && choice % 10 <= 4) return 2
  return choicesLength < 4 ? 2 : 3
}
