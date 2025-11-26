-- AlterTable
ALTER TABLE "users" ADD COLUMN     "login_otp_code" VARCHAR(10),
ADD COLUMN     "login_otp_expires" TIMESTAMP(3);
