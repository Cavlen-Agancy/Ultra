import en from './locales/en.json'
import ar from './locales/ar.json'

export default defineI18nConfig(() => ({
  legacy: false,
  globalInjection: true,
  locale: 'ar',
  fallbackLocale: 'ar',
  messages: { en, ar },
}))
