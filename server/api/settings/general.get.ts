import { defineCachedEventHandler } from 'nitropack/runtime'
import { prisma } from '../../utils/prisma'

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
    primaryDarkColor: (settings as any).primaryDarkColor || '#111111',
    primaryColor: (settings as any).primaryColor || '#111111',
    accentColor: (settings as any).accentColor || '#737373',
    offerEndDate: (settings as any).offerEndDate || null,
    announcementActive: (settings as any).announcementActive ?? true,
    announcementBgColor: (settings as any).announcementBgColor || '#737373',
    bannerTextAr: settings.bannerTextAr,
    bannerTextEn: settings.bannerTextEn,
    bannerButtonTextAr: settings.bannerButtonTextAr,
    bannerButtonTextEn: settings.bannerButtonTextEn,
    bannerButtonUrl: settings.bannerButtonUrl,
  }
}, { maxAge: 60 })
