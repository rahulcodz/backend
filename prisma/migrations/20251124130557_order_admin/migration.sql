-- CreateTable
CREATE TABLE "OrderActivity" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderActivity_orderId_idx" ON "OrderActivity"("orderId");

-- CreateIndex
CREATE INDEX "OrderActivity_authorId_idx" ON "OrderActivity"("authorId");

-- AddForeignKey
ALTER TABLE "OrderActivity" ADD CONSTRAINT "OrderActivity_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderActivity" ADD CONSTRAINT "OrderActivity_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
