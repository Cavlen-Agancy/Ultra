/**
 * Sequential document numbering backed by SiteSettings counters.
 * Invoice numbers look like INV-0001.
 */

async function ensureSettings() {
  let settings = await prisma.siteSettings.findUnique({ where: { id: 1 } })
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { id: 1, siteNameAr: 'Ultra', siteNameEn: 'Ultra' },
    })
  }
  return settings
}

export async function nextInvoiceNumber(): Promise<string> {
  const settings = await ensureSettings()
  const next = Math.max(Number((settings as any).invoiceSequenceNext ?? 1) || 1, 1)
  await prisma.siteSettings.update({ where: { id: 1 }, data: { invoiceSequenceNext: next + 1 } })
  return `INV-${String(next).padStart(4, '0')}`
}
