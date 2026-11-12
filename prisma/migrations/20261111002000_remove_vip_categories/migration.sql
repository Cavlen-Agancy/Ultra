-- Remove VIP-only category data structures.
-- Safety guard: abort before dropping anything if existing VIP access grants or
-- VIP password/version data would be lost. Archive or export those records
-- first, then rerun this migration.
DO $$
DECLARE
  grant_count BIGINT;
  secret_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO grant_count FROM "VipCategoryAccess";
  SELECT COUNT(*) INTO secret_count
  FROM "Category"
  WHERE "vipPasswordHash" IS NOT NULL OR "vipAccessVersion" <> 0;

  IF grant_count > 0 OR secret_count > 0 THEN
    RAISE EXCEPTION
      'VIP data exists (% access grants, % categories with VIP secrets). Archive or remove it before applying this migration.',
      grant_count,
      secret_count;
  END IF;
END $$;

DROP TABLE "VipCategoryAccess";

ALTER TABLE "Category"
DROP COLUMN "type",
DROP COLUMN "vipPasswordHash",
DROP COLUMN "vipAccessVersion";

DROP TYPE "CategoryType";
