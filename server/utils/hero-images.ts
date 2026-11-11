export const HERO_IMAGE_SLOTS = [1, 2, 3] as const

export type HeroImageSlot = (typeof HERO_IMAGE_SLOTS)[number]

export function parseHeroImageSlot(raw: unknown): HeroImageSlot {
  const slot = Number(raw ?? 1)
  if (!HERO_IMAGE_SLOTS.includes(slot as HeroImageSlot)) {
    throw createError({ statusCode: 400, statusMessage: 'Hero image slot must be 1, 2, or 3' })
  }
  return slot as HeroImageSlot
}

/** Prisma update payload for one hero slot, keeping slot 1 on the original column. */
export function heroImageSlotData(slot: HeroImageSlot, path: string | null) {
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
