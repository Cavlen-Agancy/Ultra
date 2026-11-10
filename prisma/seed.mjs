import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!password) {
    throw new Error('SEED_ADMIN_PASSWORD is required to seed the Ultra super admin')
  }
  if (password.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters')
  }

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Super Admin',
      passwordHash: await bcrypt.hash(password, 10),
      isSuper: true,
      isActive: true,
    },
  })

  // Neutral Ultra defaults only. No demo catalog, contact details, colors,
  // currency or tax rules are seeded; configure those from the admin panel.
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteNameAr: 'Ultra',
      siteNameEn: 'Ultra',
      primaryDarkColor: '#000000',
      primaryColor: '#000000',
      accentColor: '#D2312D',
      announcementBgColor: '#000000',
      seoMetaTitleTemplateAr: '{page} | Ultra',
      seoMetaTitleTemplateEn: '{page} | Ultra',
      seoMetaDescriptionAr: 'Ultra — متجر إلكتروني.',
      seoMetaDescriptionEn: 'Ultra — online store.',
      seoKeywords: 'Ultra, online store',
      geoDescription: 'Ultra is an online store.',
    },
  })

  console.log(`Seeded Ultra super-admin: ${email}`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
