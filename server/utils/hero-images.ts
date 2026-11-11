export const HERO_IMAGE_SLOTS = [1, 2, 3] as const

export type HeroImageSlot = (typeof HERO_IMAGE_SLOTS)[number]

export const HERO_IMAGE_VARIANTS = ['desktop', 'mobile'] as const

export type HeroImageVariant = (typeof HERO_IMAGE_VARIANTS)[number]

export interface HeroImageSlide {
  desktop: string | null
  mobile: string | null
}

export function parseHeroImageSlot(raw: unknown): HeroImageSlot {
  const slot = Number(raw ?? 1)
  if (!HERO_IMAGE_SLOTS.includes(slot as HeroImageSlot)) {
    throw createError({ statusCode: 400, statusMessage: 'Hero image slot must be 1, 2, or 3' })
  }
  return slot as HeroImageSlot
}

export function parseHeroImageVariant(raw: unknown): HeroImageVariant {
  const variant = String(raw ?? 'desktop').trim().toLowerCase()
  if (!HERO_IMAGE_VARIANTS.includes(variant as HeroImageVariant)) {
    throw createError({ statusCode: 400, statusMessage: 'Hero image variant must be desktop or mobile' })
  }
  return variant as HeroImageVariant
}

/** Prisma update payload for one hero slot/variant, keeping slot 1 on the original columns. */
export function heroImageSlotData(slot: HeroImageSlot, variant: HeroImageVariant, path: string | null) {
  if (variant === 'mobile') {
    if (slot === 2) return { heroMobileImagePath2: path }
    if (slot === 3) return { heroMobileImagePath3: path }
    return { heroMobileImagePath: path }
  }
  if (slot === 2) return { heroImagePath2: path }
  if (slot === 3) return { heroImagePath3: path }
  return { heroImagePath: path }
}

export function getHeroImagePaths(settings: {
  heroImagePath?: string | null
  heroImagePath2?: string | null
  heroImagePath3?: string | null
} | null | undefined): string[] {
  if (!settings) return []
  return [settings.heroImagePath, settings.heroImagePath2, settings.heroImagePath3]
    .filter((path): path is string => Boolean(path))
}

/** Slides that have at least one variant, in fixed slot order. */
export function getHeroSlides(settings: {
  heroImagePath?: string | null
  heroImagePath2?: string | null
  heroImagePath3?: string | null
  heroMobileImagePath?: string | null
  heroMobileImagePath2?: string | null
  heroMobileImagePath3?: string | null
} | null | undefined): HeroImageSlide[] {
  if (!settings) return []
  return [
    { desktop: settings.heroImagePath ?? null, mobile: settings.heroMobileImagePath ?? null },
    { desktop: settings.heroImagePath2 ?? null, mobile: settings.heroMobileImagePath2 ?? null },
    { desktop: settings.heroImagePath3 ?? null, mobile: settings.heroMobileImagePath3 ?? null },
  ].filter(slide => slide.desktop || slide.mobile)
}
