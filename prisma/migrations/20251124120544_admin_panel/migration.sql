-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


DO $$
BEGIN
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'Received';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'Accepted';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
