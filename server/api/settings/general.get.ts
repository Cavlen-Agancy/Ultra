import { defineCachedEventHandler } from 'nitropack/runtime'
import { prisma } from '../../utils/prisma'
import { getHeroImagePaths } from '../../utils/hero-images'

export default defineCachedEventHandler(async () => {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } })
  if (!settings) return null
  return {
    siteNameAr: settings.siteNameAr,
    siteNameEn: settings.siteNameEn,
    taglineAr: settings.taglineAr,
    taglineEn: settings.taglineEn,
    logoPath: settings.logoPath,
    faviconPath: settings.faviconPath,
    heroImagePath: settings.heroImagePath,
    heroImagePaths: getHeroImagePaths(settings),
    primaryDarkColor: (settings as any).primaryDarkColor || '#000000',
    primaryColor: (settings as any).primaryColor || '#000000',
    accentColor: (settings as any).accentColor || '#D2312D',
    offerEndDate: (settings as any).offerEndDate || null,
    announcementActive: (settings as any).announcementActive ?? true,
    announcementBgColor: (settings as any).announcementBgColor || '#000000',
    bannerTextAr: settings.bannerTextAr,
    bannerTextEn: settings.bannerTextEn,
    bannerButtonTextAr: settings.bannerButtonTextAr,
    bannerButtonTextEn: settings.bannerButtonTextEn,
    bannerButtonUrl: settings.bannerButtonUrl,
  }
}, { maxAge: 60 })
