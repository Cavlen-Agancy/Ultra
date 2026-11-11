-- Add optional mobile variants for the three homepage hero slides.
-- Existing heroImagePath/2/3 values remain the desktop images, so no data
-- migration or backfill is required.
ALTER TABLE "SiteSettings"
ADD COLUMN "heroMobileImagePath" TEXT,
ADD COLUMN "heroMobileImagePath2" TEXT,
ADD COLUMN "heroMobileImagePath3" TEXT;
