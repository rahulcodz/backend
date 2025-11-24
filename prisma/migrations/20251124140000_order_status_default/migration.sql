-- Ensure the new enum value is already present (handled in previous migration)
-- Now it is safe to set the default to 'Received'

ALTER TABLE "Order"
  ALTER COLUMN "status" SET DEFAULT 'Received';

