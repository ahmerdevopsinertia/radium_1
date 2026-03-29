-- CreateTable
CREATE TABLE "DeliveryCheck" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "reasons" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkBatch" (
    "id" TEXT NOT NULL,
    "totalOrders" INTEGER NOT NULL,
    "resultPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkBatch_pkey" PRIMARY KEY ("id")
);
