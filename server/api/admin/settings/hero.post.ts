import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { requirePermission } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'
import { assertImagePart, storeFile } from '../../../utils/storage'
import { heroImageSlotData, parseHeroImageSlot } from '../../../utils/hero-images'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.manage')
  const formData = await readMultipartFormData(event)
  if (!formData?.length) throw createError({ statusCode: 400, message: 'No file provided' })

  const file = formData.find(part => part.name === 'file' && part.filename)
    ?? formData.find(part => part.filename)
  if (!file?.filename || !file.data?.length || !file.type) {
    throw createError({ statusCode: 400, message: 'Invalid file' })
  }

  // Same JPG/PNG/WEBP + 5MB rules as product and category image uploads.
  assertImagePart({ type: file.type, data: file.data })

  const slotPart = formData.find(part => part.name === 'slot')
  const slot = parseHeroImageSlot(slotPart?.data.toString('utf8'))
  const { relativePath } = await storeFile(
    file.data,
    'settings',
    `hero-${slot}-${Date.now()}-${file.filename}`,
  )
  const data = heroImageSlotData(slot, relativePath)

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { siteNameAr: 'Ultra', siteNameEn: 'Ultra', ...data },
  })
  return { success: true, slot, path: relativePath }
})
