-- CreateEnum
CREATE TYPE "AddressLabel" AS ENUM ('HOME', 'WAREHOUSE', 'GODOWN', 'SHOP', 'OTHER');

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" "AddressLabel" NOT NULL DEFAULT 'OTHER',
    "contactName" VARCHAR(150) NOT NULL,
    "contactNumber" VARCHAR(20),
    "addressLine1" VARCHAR(255) NOT NULL,
    "addressLine2" VARCHAR(255),
    "city" VARCHAR(120),
    "state" VARCHAR(120) NOT NULL,
    "pincode" VARCHAR(12) NOT NULL,
    "landmark" VARCHAR(255),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_account_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "order_message_notifications" BOOLEAN NOT NULL DEFAULT true,
    "order_activity_notifications" BOOLEAN NOT NULL DEFAULT true,
    "dnd_enabled" BOOLEAN NOT NULL DEFAULT false,
    "dnd_from" TIMESTAMP(3),
    "dnd_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_account_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_help_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "subject" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "attachment_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_help_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_addresses_userId_idx" ON "user_addresses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_settings_userId_key" ON "user_account_settings"("userId");

-- CreateIndex
CREATE INDEX "user_help_requests_userId_idx" ON "user_help_requests"("userId");

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_account_settings" ADD CONSTRAINT "user_account_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_help_requests" ADD CONSTRAINT "user_help_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
