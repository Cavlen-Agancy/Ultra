// Dynamically generated XML sitemap: static pages + active categories
// and published products, with ar (default, unprefixed) / en (/en) alternates.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const origin = getRequestURL(event).origin
  const base = (config.public.siteUrl as string) || origin

  const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const iso = (d: Date) => d.toISOString().split('T')[0]
  const today = iso(new Date())

  const statics: { loc: string, changefreq: string, priority: string }[] = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/products', changefreq: 'daily', priority: '0.9' },
  ]

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { products: { some: { isActive: true } } },
      select: { slug: true, updatedAt: true },
      take: 5000,
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        categories: { none: { category: { type: 'VIP' } } },
      },
      select: { slug: true, updatedAt: true },
      take: 5000,
    }),
  ])

  const paths: { loc: string, lastmod: string, changefreq: string, priority: string }[] = []
  for (const s of statics) {
    paths.push({ loc: s.loc, lastmod: today, changefreq: s.changefreq, priority: s.priority })
  }
  for (const c of categories) {
    paths.push({ loc: `/products/${c.slug}`, lastmod: iso(c.updatedAt), changefreq: 'weekly', priority: '0.8' })
  }
  for (const p of products) {
    paths.push({ loc: `/p/${p.slug}`, lastmod: iso(p.updatedAt), changefreq: 'weekly', priority: '0.9' })
  }

  const urls: string[] = paths.map(p =>
    `  <url><loc>${esc(base + p.loc)}</loc>`
    + `<xhtml:link rel="alternate" hreflang="ar" href="${esc(base + p.loc)}"/>`
    + `<xhtml:link rel="alternate" hreflang="en" href="${esc(base + '/en' + p.loc)}"/>`
    + `<lastmod>${p.lastmod}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`,
  )

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>`
})
