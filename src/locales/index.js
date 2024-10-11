import en from '@/locales/en.json'
import enHelp from '@/locales/pages/help/en.json'
import enRules from '@/locales/pages/rules/en.json'

import es from '@/locales/es.json'
import ru from '@/locales/ru.json'
import zh from '@/locales/zh.json'
import fr from '@/locales/fr.json'
import de from '@/locales/de.json'
import pt from '@/locales/pt.json'
import ar from '@/locales/ar.json'
import hi from '@/locales/hi.json'
import ja from '@/locales/ja.json'
import ko from '@/locales/ko.json'

import ruHelp from '@/locales/pages/help/ru.json'
import ruRules from '@/locales/pages/rules/ru.json'

export const messages = {
    en: {
        ...en,
        pages: {
            help: enHelp.pages.help,
            rules: enRules.pages.rules,
        }
    },
    es: {
        ...es,
        pages: {
            help: enHelp.pages.help,
            rules: enRules.pages.rules,
        }
    },
    zh: {
        ...zh,
        pages: {
            help: enHelp.pages.help,
            rules: enRules.pages.rules,
        }
    },
    fr: {
        ...fr,
        pages: {
            help: enHelp.pages.help,
            rules: enRules.pages.rules,
        }
    },
    de: {
        ...de,
        pages: {
            help: enHelp.pages.help,
            rules: enRules.pages.rules,
        }
    },
    pt: {
        ...pt,
        pages: {
            help: enHelp.pages.help,
            rules: enRules.pages.rules,
        }
    },
    ar: {
        ...ar,
        pages: {
            help: enHelp.pages.help,
            rules: enRules.pages.rules,
        }
    },
    hi: {
        ...hi,
        pages: {
            help: enHelp.pages.help,
            rules: enRules.pages.rules,
        }
    },
    ja: {
        ...ja,
        pages: {
            help: enHelp.pages.help,
            rules: enRules.pages.rules,
        }
    },
    ko: {
        ...ko,
        pages: {
            help: enHelp.pages.help,
            rules: enRules.pages.rules,
        }
    },
    ru: {
        ...ru,
        pages: {
            help: ruHelp.pages.help,
            rules: ruRules.pages.rules,
        }
    }
};


export function ruCountRule(choice, choicesLength) {

    if (choice === 0) {
        return 0
    }

    const teen = choice > 10 && choice < 20
    const endsWithOne = choice % 10 === 1
    if (!teen && endsWithOne) {
        return 1
    }
    if (!teen && choice % 10 >= 2 && choice % 10 <= 4) {
        return 2
    }

    return choicesLength < 4 ? 2 : 3
}

