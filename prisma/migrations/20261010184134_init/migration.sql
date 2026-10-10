-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STORE', 'SUPERVISOR', 'QC', 'ACCOUNTS', 'BUYER');

-- CreateEnum
CREATE TYPE "MachineType" AS ENUM ('SPINNING', 'WEAVING', 'DYEING');

-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('RUNNING', 'IDLE', 'BREAKDOWN', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "StockMovementReason" AS ENUM ('RECEIPT', 'ISSUE', 'ADJUST', 'RESERVE', 'RELEASE');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'RECEIVED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CONFIRMED', 'IN_PRODUCTION', 'QC', 'READY', 'DISPATCHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductionStage" AS ENUM ('SPINNING', 'WEAVING', 'DYEING');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('PLANNED', 'RUNNING', 'DONE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "QCStatus" AS ENUM ('PENDING', 'PASSED', 'REWORK', 'REJECTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "buyerId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counter" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Buyer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Buyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "role" TEXT,
    "phone" TEXT,
    "dailyRate" DECIMAL(10,2) NOT NULL,
    "otRatePerHour" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "type" "MachineType" NOT NULL,
    "status" "MachineStatus" NOT NULL DEFAULT 'IDLE',
    "hourlyOverhead" DECIMAL(10,2) NOT NULL,
    "capacityPerHour" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YarnType" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "colour" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'KG',
    "reorderLevel" DECIMAL(12,2) NOT NULL,
    "ratePerUnit" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YarnType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "yarnTypeId" TEXT NOT NULL,
    "qty" DECIMAL(12,2) NOT NULL,
    "reason" "StockMovementReason" NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNo" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "POStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseLine" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "yarnTypeId" TEXT NOT NULL,
    "qty" DECIMAL(12,2) NOT NULL,
    "receivedQty" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "rate" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" TEXT NOT NULL,
    "poLineId" TEXT,
    "yarnTypeId" TEXT NOT NULL,
    "qty" DECIMAL(12,2) NOT NULL,
    "orderId" TEXT,
    "receivedById" TEXT,
    "vehicleNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "fabricType" TEXT NOT NULL,
    "colour" TEXT NOT NULL,
    "qtyMetres" DECIMAL(12,2) NOT NULL,
    "ratePerMetre" DECIMAL(10,2) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOM" (
    "id" TEXT NOT NULL,
    "fabricType" TEXT NOT NULL,
    "yarnTypeId" TEXT NOT NULL,
    "yarnPerMetre" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BOM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stage" "ProductionStage" NOT NULL,
    "machineId" TEXT,
    "targetQty" DECIMAL(12,2) NOT NULL,
    "producedQty" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'PLANNED',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionLog" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "qty" DECIMAL(12,2) NOT NULL,
    "hours" DECIMAL(6,2) NOT NULL,
    "operatorId" TEXT,
    "shift" "Shift" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roll" (
    "id" TEXT NOT NULL,
    "rollNo" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "machineId" TEXT,
    "lengthM" DECIMAL(10,2) NOT NULL,
    "qcStatus" "QCStatus" NOT NULL DEFAULT 'PENDING',
    "dispatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QCInspection" (
    "id" TEXT NOT NULL,
    "rollId" TEXT NOT NULL,
    "inspectorId" TEXT,
    "result" "QCStatus" NOT NULL,
    "defects" JSONB,
    "severity" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QCInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispatch" (
    "id" TEXT NOT NULL,
    "dispatchNo" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchLine" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "rollId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxPct" DECIMAL(5,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shift" "Shift" NOT NULL,
    "hours" DECIMAL(5,2) NOT NULL,
    "overtimeHours" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "present" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WageRecord" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "finalisedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "role" "Role",
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_buyerId_idx" ON "User"("buyerId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_active_idx" ON "User"("active");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Counter_key_key" ON "Counter"("key");

-- CreateIndex
CREATE INDEX "Counter_key_idx" ON "Counter"("key");

-- CreateIndex
CREATE INDEX "Supplier_active_idx" ON "Supplier"("active");

-- CreateIndex
CREATE INDEX "Supplier_createdAt_idx" ON "Supplier"("createdAt");

-- CreateIndex
CREATE INDEX "Buyer_active_idx" ON "Buyer"("active");

-- CreateIndex
CREATE INDEX "Buyer_createdAt_idx" ON "Buyer"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_code_key" ON "Worker"("code");

-- CreateIndex
CREATE INDEX "Worker_active_idx" ON "Worker"("active");

-- CreateIndex
CREATE INDEX "Worker_createdAt_idx" ON "Worker"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_code_key" ON "Machine"("code");

-- CreateIndex
CREATE INDEX "Machine_code_idx" ON "Machine"("code");

-- CreateIndex
CREATE INDEX "Machine_type_idx" ON "Machine"("type");

-- CreateIndex
CREATE INDEX "Machine_status_idx" ON "Machine"("status");

-- CreateIndex
CREATE INDEX "Machine_createdAt_idx" ON "Machine"("createdAt");

-- CreateIndex
CREATE INDEX "YarnType_createdAt_idx" ON "YarnType"("createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_yarnTypeId_idx" ON "StockMovement"("yarnTypeId");

-- CreateIndex
CREATE INDEX "StockMovement_createdById_idx" ON "StockMovement"("createdById");

-- CreateIndex
CREATE INDEX "StockMovement_reason_idx" ON "StockMovement"("reason");

-- CreateIndex
CREATE INDEX "StockMovement_refType_refId_idx" ON "StockMovement"("refType", "refId");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_yarnTypeId_createdAt_idx" ON "StockMovement"("yarnTypeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNo_key" ON "PurchaseOrder"("poNo");

-- CreateIndex
CREATE INDEX "PurchaseOrder_poNo_idx" ON "PurchaseOrder"("poNo");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_createdAt_idx" ON "PurchaseOrder"("createdAt");

-- CreateIndex
CREATE INDEX "PurchaseLine_poId_idx" ON "PurchaseLine"("poId");

-- CreateIndex
CREATE INDEX "PurchaseLine_yarnTypeId_idx" ON "PurchaseLine"("yarnTypeId");

-- CreateIndex
CREATE INDEX "PurchaseLine_createdAt_idx" ON "PurchaseLine"("createdAt");

-- CreateIndex
CREATE INDEX "GoodsReceipt_poLineId_idx" ON "GoodsReceipt"("poLineId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_yarnTypeId_idx" ON "GoodsReceipt"("yarnTypeId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_orderId_idx" ON "GoodsReceipt"("orderId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_receivedById_idx" ON "GoodsReceipt"("receivedById");

-- CreateIndex
CREATE INDEX "GoodsReceipt_createdAt_idx" ON "GoodsReceipt"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");

-- CreateIndex
CREATE INDEX "Order_orderNo_idx" ON "Order"("orderNo");

-- CreateIndex
CREATE INDEX "Order_buyerId_idx" ON "Order"("buyerId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_buyerId_status_idx" ON "Order"("buyerId", "status");

-- CreateIndex
CREATE INDEX "BOM_yarnTypeId_idx" ON "BOM"("yarnTypeId");

-- CreateIndex
CREATE INDEX "BOM_fabricType_idx" ON "BOM"("fabricType");

-- CreateIndex
CREATE INDEX "BOM_createdAt_idx" ON "BOM"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BOM_fabricType_yarnTypeId_key" ON "BOM"("fabricType", "yarnTypeId");

-- CreateIndex
CREATE INDEX "WorkOrder_orderId_idx" ON "WorkOrder"("orderId");

-- CreateIndex
CREATE INDEX "WorkOrder_machineId_idx" ON "WorkOrder"("machineId");

-- CreateIndex
CREATE INDEX "WorkOrder_stage_idx" ON "WorkOrder"("stage");

-- CreateIndex
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");

-- CreateIndex
CREATE INDEX "WorkOrder_createdAt_idx" ON "WorkOrder"("createdAt");

-- CreateIndex
CREATE INDEX "WorkOrder_orderId_status_idx" ON "WorkOrder"("orderId", "status");

-- CreateIndex
CREATE INDEX "WorkOrder_machineId_status_idx" ON "WorkOrder"("machineId", "status");

-- CreateIndex
CREATE INDEX "ProductionLog_workOrderId_idx" ON "ProductionLog"("workOrderId");

-- CreateIndex
CREATE INDEX "ProductionLog_operatorId_idx" ON "ProductionLog"("operatorId");

-- CreateIndex
CREATE INDEX "ProductionLog_shift_idx" ON "ProductionLog"("shift");

-- CreateIndex
CREATE INDEX "ProductionLog_createdAt_idx" ON "ProductionLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Roll_rollNo_key" ON "Roll"("rollNo");

-- CreateIndex
CREATE INDEX "Roll_rollNo_idx" ON "Roll"("rollNo");

-- CreateIndex
CREATE INDEX "Roll_orderId_idx" ON "Roll"("orderId");

-- CreateIndex
CREATE INDEX "Roll_workOrderId_idx" ON "Roll"("workOrderId");

-- CreateIndex
CREATE INDEX "Roll_machineId_idx" ON "Roll"("machineId");

-- CreateIndex
CREATE INDEX "Roll_dispatchId_idx" ON "Roll"("dispatchId");

-- CreateIndex
CREATE INDEX "Roll_qcStatus_idx" ON "Roll"("qcStatus");

-- CreateIndex
CREATE INDEX "Roll_createdAt_idx" ON "Roll"("createdAt");

-- CreateIndex
CREATE INDEX "Roll_orderId_qcStatus_idx" ON "Roll"("orderId", "qcStatus");

-- CreateIndex
CREATE INDEX "QCInspection_rollId_idx" ON "QCInspection"("rollId");

-- CreateIndex
CREATE INDEX "QCInspection_inspectorId_idx" ON "QCInspection"("inspectorId");

-- CreateIndex
CREATE INDEX "QCInspection_result_idx" ON "QCInspection"("result");

-- CreateIndex
CREATE INDEX "QCInspection_createdAt_idx" ON "QCInspection"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Dispatch_dispatchNo_key" ON "Dispatch"("dispatchNo");

-- CreateIndex
CREATE INDEX "Dispatch_dispatchNo_idx" ON "Dispatch"("dispatchNo");

-- CreateIndex
CREATE INDEX "Dispatch_orderId_idx" ON "Dispatch"("orderId");

-- CreateIndex
CREATE INDEX "Dispatch_dispatchedAt_idx" ON "Dispatch"("dispatchedAt");

-- CreateIndex
CREATE INDEX "Dispatch_createdAt_idx" ON "Dispatch"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchLine_rollId_key" ON "DispatchLine"("rollId");

-- CreateIndex
CREATE INDEX "DispatchLine_dispatchId_idx" ON "DispatchLine"("dispatchId");

-- CreateIndex
CREATE INDEX "DispatchLine_rollId_idx" ON "DispatchLine"("rollId");

-- CreateIndex
CREATE INDEX "DispatchLine_createdAt_idx" ON "DispatchLine"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_dispatchId_key" ON "Invoice"("dispatchId");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNo_idx" ON "Invoice"("invoiceNo");

-- CreateIndex
CREATE INDEX "Invoice_dispatchId_idx" ON "Invoice"("dispatchId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Attendance_workerId_idx" ON "Attendance"("workerId");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE INDEX "Attendance_shift_idx" ON "Attendance"("shift");

-- CreateIndex
CREATE INDEX "Attendance_createdAt_idx" ON "Attendance"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_workerId_date_shift_key" ON "Attendance"("workerId", "date", "shift");

-- CreateIndex
CREATE INDEX "WageRecord_workerId_idx" ON "WageRecord"("workerId");

-- CreateIndex
CREATE INDEX "WageRecord_month_idx" ON "WageRecord"("month");

-- CreateIndex
CREATE INDEX "WageRecord_createdAt_idx" ON "WageRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WageRecord_workerId_month_key" ON "WageRecord"("workerId", "month");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_orderId_idx" ON "Expense"("orderId");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_createdAt_idx" ON "Expense"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_role_idx" ON "Notification"("role");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_yarnTypeId_fkey" FOREIGN KEY ("yarnTypeId") REFERENCES "YarnType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseLine" ADD CONSTRAINT "PurchaseLine_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseLine" ADD CONSTRAINT "PurchaseLine_yarnTypeId_fkey" FOREIGN KEY ("yarnTypeId") REFERENCES "YarnType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_poLineId_fkey" FOREIGN KEY ("poLineId") REFERENCES "PurchaseLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_yarnTypeId_fkey" FOREIGN KEY ("yarnTypeId") REFERENCES "YarnType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOM" ADD CONSTRAINT "BOM_yarnTypeId_fkey" FOREIGN KEY ("yarnTypeId") REFERENCES "YarnType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roll" ADD CONSTRAINT "Roll_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roll" ADD CONSTRAINT "Roll_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roll" ADD CONSTRAINT "Roll_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roll" ADD CONSTRAINT "Roll_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCInspection" ADD CONSTRAINT "QCInspection_rollId_fkey" FOREIGN KEY ("rollId") REFERENCES "Roll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCInspection" ADD CONSTRAINT "QCInspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchLine" ADD CONSTRAINT "DispatchLine_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchLine" ADD CONSTRAINT "DispatchLine_rollId_fkey" FOREIGN KEY ("rollId") REFERENCES "Roll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WageRecord" ADD CONSTRAINT "WageRecord_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
