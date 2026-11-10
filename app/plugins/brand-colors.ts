/**
 * Applies admin-configured brand colors as CSS variables.
 * Maps SiteSettings (primaryColor → --primary, accentColor → --accent)
 * so the admin panel can still override the palette at runtime.
 * The base tokens in assets/css/main.css stay mode-aware; this plugin only
 * overrides when the admin saved custom values. On- colors are picked by
 * luminance so custom colors keep readable contrast in both modes.
 * Defaults follow the Ultra palette: black primary with a restrained red accent.
 */
function hexToChannels(hex: string): string {
  const h = hex.replace('#', '')
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16)
  return `${n(0)} ${n(2)} ${n(4)}`
}

/** White text on dark colors, ink text on light colors. */
function onChannels(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return lum > 0.45 ? '0 0 0' : '255 255 255'
}

const DEFAULT_PRIMARY = '#000000'
const DEFAULT_ACCENT = '#D2312D'

export default defineNuxtPlugin(async () => {
  const brandColors = { primaryDark: DEFAULT_PRIMARY, primary: DEFAULT_PRIMARY, accent: DEFAULT_ACCENT }
  const HEX_RE = /^#[0-9a-fA-F]{6}$/
  try {
    const general = await $fetch<{
      primaryDarkColor?: string
      primaryColor?: string
      accentColor?: string
    }>('/api/settings/general')
    brandColors.primaryDark = HEX_RE.test(String(general?.primaryDarkColor || '')) ? general!.primaryDarkColor! : DEFAULT_PRIMARY
    brandColors.primary = HEX_RE.test(String(general?.primaryColor || '')) ? general!.primaryColor! : DEFAULT_PRIMARY
    brandColors.accent = HEX_RE.test(String(general?.accentColor || '')) ? general!.accentColor! : DEFAULT_ACCENT
    if (import.meta.client) {
      const root = document.documentElement
      const apply = () => {
        // New two-layer names (RGB channels for Tailwind opacity support)
        root.style.setProperty('--primary', hexToChannels(brandColors.primary))
        root.style.setProperty('--on-primary', onChannels(brandColors.primary))
        root.style.setProperty('--accent', hexToChannels(brandColors.accent))
        root.style.setProperty('--accent-hover', hexToChannels(brandColors.accent))
        root.style.setProperty('--on-accent', onChannels(brandColors.accent))
        // Legacy names (kept for files binding var(--color-*) inline)
        root.style.setProperty('--color-primary-dark', brandColors.primaryDark)
        root.style.setProperty('--color-primary', brandColors.primary)
        root.style.setProperty('--color-accent', brandColors.accent)
        root.style.setProperty('--color-info', brandColors.primary)
        root.style.setProperty('--color-warning', brandColors.accent)
      }
      apply()
      const colorMode = useColorMode()
      watch(() => colorMode.value, () => apply())
    }
  }
  catch {
    // Offline / first boot — CSS defaults apply.
  }

  return { provide: { brandColors } }
})
