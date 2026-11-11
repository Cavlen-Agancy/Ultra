-- Add the second and third homepage hero image slots. The existing
-- "heroImagePath" column remains the first slot so current settings continue
-- to work without a data migration.
ALTER TABLE "SiteSettings"
ADD COLUMN "heroImagePath2" TEXT,
ADD COLUMN "heroImagePath3" TEXT;
