# Threadline Services Architecture & API Reference

All business logic, multi-step transactions, and data access routines are implemented in `src/services/`.
Direct database updates outside these service modules are disallowed to maintain strict audit integrity and atomic operations.

---

## 1. Inventory & Stock Ledger (`src/services/inventory.ts`)

### Stock Balance Rules
- **Signed Quantities**:
  - `RECEIPT`: Positive (+)
  - `ISSUE`: Negative (-)
  - `ADJUST`: Signed (+ or -)
  - `RESERVE`: Positive (+)
  - `RELEASE`: Positive (+)
- **Equations**:
  - $\text{onHand} = \sum(\text{RECEIPT}) + \sum(\text{ISSUE}) + \sum(\text{ADJUST})$
  - $\text{reserved} = \sum(\text{RESERVE}) - \sum(\text{RELEASE})$
  - $\text{available} = \text{onHand} - \text{reserved}$

### Exported Signatures
```typescript
export async function getStockSummary(): Promise<YarnStockSummary[]>;
export async function getAvailableStock(yarnTypeId: string): Promise<{ onHand: number; reserved: number; available: number }>;
export async function getLowStockCount(): Promise<number>;
export async function createGoodsReceipt(input: GoodsReceiptInput): Promise<GoodsReceipt>;
export async function adjustStock(input: StockAdjustmentInput): Promise<StockMovement>;
export async function reserveYarnForOrder(orderId: string): Promise<{ ok: boolean; shortfalls: YarnShortfall[] }>;
export async function releaseReservation(orderId: string): Promise<void>;
export async function issueYarnToWorkOrder(workOrderId: string, yarnTypeId: string, qty: number): Promise<StockMovement>;
export async function triggerLowStockNotifications(): Promise<void>;
export async function getStockMovementsLedger(filter: StockLedgerFilter): Promise<PaginatedResult<StockMovementRow>>;
```

### Error Types
- `InsufficientStockError`: Thrown when physical floor issuance exceeds available physical stock (`onHand < qty`).
- `ReservationFailedError`: Thrown when a requirement line exceeds available warehouse stock.

---

## 2. Master Data (`src/services/master.ts`)

Handles foundational operational catalogs for Everest Textile Mills.

### Exported Signatures
```typescript
export async function getSuppliers(params: PaginationQuery): Promise<PaginatedResult<Supplier>>;
export async function createSupplier(input: SupplierInput): Promise<Supplier>;
export async function updateSupplier(id: string, input: Partial<SupplierInput>): Promise<Supplier>;
export async function toggleSupplierActive(id: string, active: boolean): Promise<Supplier>;

export async function getBuyers(params: PaginationQuery): Promise<PaginatedResult<Buyer>>;
export async function createBuyer(input: BuyerInput): Promise<Buyer>;
export async function updateBuyer(id: string, input: Partial<BuyerInput>): Promise<Buyer>;
export async function toggleBuyerActive(id: string, active: boolean): Promise<Buyer>;

export async function getMachines(params: PaginationQuery): Promise<PaginatedResult<Machine>>;
export async function createMachine(input: MachineInput): Promise<Machine>;
export async function updateMachine(id: string, input: Partial<MachineInput>): Promise<Machine>;

export async function getWorkers(params: PaginationQuery): Promise<PaginatedResult<Worker>>;
export async function createWorker(input: WorkerInput): Promise<Worker>;
export async function updateWorker(id: string, input: Partial<WorkerInput>): Promise<Worker>;
export async function toggleWorkerActive(id: string, active: boolean): Promise<Worker>;

export async function getYarnTypes(params: PaginationQuery): Promise<PaginatedResult<YarnType>>;
export async function createYarnType(input: YarnTypeInput): Promise<YarnType>;
export async function updateYarnType(id: string, input: Partial<YarnTypeInput>): Promise<YarnType>;

export async function getBOMs(params: PaginationQuery & { fabricType?: string }): Promise<PaginatedResult<BOM>>;
export async function upsertBOM(input: BomInput): Promise<BOM>;
export async function deleteBOM(id: string): Promise<BOM>;
```

---

## 3. Orders & Material Planning (`src/services/orders.ts` & `src/services/feasibility.ts`)

Handles customer fabric contracts, material reservation checks, and order cancellation.

### Exported Signatures
```typescript
export async function getOrders(params: { page?: number; pageSize?: number; status?: OrderStatus; search?: string }): Promise<PaginatedResult<OrderRow>>;
export async function getOrderDetail(orderId: string): Promise<OrderDetail | null>;
export async function createOrder(input: CreateOrderInput): Promise<Order>;
export async function cancelOrder(orderId: string): Promise<Order>;
export async function checkFeasibility(input: CheckFeasibilityInput): Promise<FeasibilityResult>;
```

---

## 4. Procurement & Purchase Orders (`src/services/procurement.ts`)

Supplier purchase orders and automatic generation of replenishment orders for identified shortfalls.

### Exported Signatures
```typescript
export async function getPurchaseOrders(params: { page?: number; pageSize?: number; status?: POStatus; supplierId?: string }): Promise<PaginatedResult<PurchaseOrderRow>>;
export async function createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder>;
export async function updatePOStatus(poId: string, status: POStatus): Promise<PurchaseOrder>;
export async function createPOForShortfall(supplierId: string, lines: Array<{ yarnTypeId: string; qty: number; rate?: number }>): Promise<PurchaseOrder>;
```

---

## 5. Production & Manufacturing Floor (`src/services/production.ts`)

Handles shop-floor scheduling, machine board monitoring, stage-by-stage work orders, and roll batch generation.

### Stage Workflow
1. **SPINNING**: Consumes raw cotton/polyester yarn via `issueYarnToWorkOrder` in proportion to logged output metres.
2. **WEAVING**: Converts spun yarn into raw greige fabric.
3. **DYEING**: Applies wet processing, finishing, and partitions output into standardised 50m fabric rolls (`ROLL_LENGTH_M = 50`) with unique `RL-XXXXXX` barcodes and `PENDING` QC status. Remainder rolls are generated upon stage completion.

### Exported Signatures
```typescript
export async function getPlanningEligibleOrders(): Promise<EligibleOrder[]>;
export async function getIdleMachines(): Promise<{ spinning: Machine[]; weaving: Machine[]; dyeing: Machine[] }>;
export async function planProduction(input: PlanProductionInput): Promise<WorkOrder[]>;
export async function getMachineBoard(): Promise<MachineBoardSummary>;
export async function startWorkOrder(workOrderId: string): Promise<WorkOrder>;
export async function recordMachineBreakdown(machineId: string, reason?: string): Promise<{ ok: boolean }>;
export async function setMachineMaintenance(machineId: string, reason?: string): Promise<{ ok: boolean }>;
export async function resumeMachine(machineId: string): Promise<{ ok: boolean }>;
export async function markMachineIdle(machineId: string): Promise<Machine>;
export async function logProductionOutput(input: LogOutputInput): Promise<{ log: ProductionLog; updatedWO: WorkOrder }>;
export async function getWorkOrders(filters: WorkOrdersFilterInput): Promise<PaginatedResult<WorkOrderRow>>;
```

---

## 6. Quality Control & Roll Traceability (`src/services/quality.ts`)

Handles roll grading, defect inspections, order readiness evaluation, and QR-enabled digital provenance.

### Rules & Enforcements
1. **Defect Checklist**: `REWORK` and `REJECT` outcomes require at least one identified defect with severity (`minor`, `major`, `critical`).
2. **Supervisor Escalation**: Marking a roll for `REWORK` automatically triggers a notification for `SUPERVISOR` personnel.
3. **Order Completion Trigger**: Once all rolls for an order are resolved (`no PENDING or REWORK`) and total `PASSED` length reaches $\ge 98\%$ of order quantity, the order status transitions to `READY` and triggers a notification for `ACCOUNTS`.

### Exported Signatures
```typescript
export async function getQCKpiSummary(): Promise<QCKpiSummary>;
export async function getQCQueue(filters: QCQueueFilterInput): Promise<PaginatedResult<QCQueueRow>>;
export async function inspectRoll(input: InspectRollInput): Promise<QCInspectionResult>;
export async function markReworkDone(input: ReworkDoneInput): Promise<Roll>;
export async function getRollTrace(rollNo: string): Promise<RollTraceDetail | null>;
export async function getRollsRegister(filters: RollsRegisterFilterInput): Promise<PaginatedResult<RollRegisterRow>>;
```

---

## 7. Dispatch & Logistics (`src/services/dispatch.ts`)

Handles race-safe finished goods allocation, vehicle manifests, and automatic billing invoice generation.

### Rules & Enforcements
1. **Roll Eligibility**: Only rolls with `qcStatus = 'PASSED'` and `dispatchId = null` can be allocated to a dispatch manifest.
2. **Race-Safe Concurrency**: Atomic claim via `updateMany({ where: { id: { in: rollIds }, dispatchId: null, qcStatus: 'PASSED' } })` ensures that parallel requests attempting to allocate the same roll will abort and roll back with an explicit error.
3. **Sequential Identifiers**: Uses `nextNumber("dispatch", "DSP-")` and `nextNumber("invoice", "INV-")`.
4. **Automatic Billing**: Every dispatch automatically generates an `Invoice` with subtotal ($\text{totalMetres} \times \text{order.ratePerMetre}$), standard 5% tax, and status `UNPAID`.
5. **Order Completion**: Transitions `Order.status` to `DISPATCHED` when all of its passed rolls have been claimed.
6. **Role Guardrails**:
   - `ADMIN`, `STORE`, `ACCOUNTS`: Can initiate dispatches.
   - `SUPERVISOR`, `QC`: Can inspect finished goods and shipment history.

### Exported Signatures
```typescript
export async function getFinishedGoodsSummary(): Promise<FinishedGoodsSummary>;
export async function getOrderForDispatch(orderId: string): Promise<OrderDispatchData>;
export async function createDispatch(orderId: string, rollIds: string[], vehicleNo: string, driver: string): Promise<CreateDispatchResult>;
export async function getDispatchHistory(input: DispatchFilterInput): Promise<PaginatedDispatches>;

---

## 8. Invoicing & Payments (`src/services/payments.ts`)

Handles commercial billing lifecycle, payment allocations, accounts receivable analytics, and dynamic on-the-fly PDF invoice generation.

### Rules & Enforcements
1. **Invoice Lifecycle**:
   - Status transitions: `UNPAID` $\rightarrow$ `PARTIAL` $\rightarrow$ `PAID`.
   - Age calculation: Elapsed days since invoice creation. Invoices unpaid or partially paid for $> 30$ days are flagged as overdue.
2. **Payment Allocation**:
   - Managed in a single atomic transaction: Inserts `Payment`, recalculates `paidAmount` and remaining `outstanding`.
   - Strict validation: Payment amount cannot exceed the current outstanding balance.
   - Status updates dynamically: If `paidAmount >= total`, status becomes `PAID`; if `paidAmount > 0`, status becomes `PARTIAL`; otherwise `UNPAID`.
   - Comprehensive audit logging via `createAuditLog`.
3. **Dynamic On-the-Fly PDF (`/api/invoices/[id]/pdf`)**:
   - Generated dynamically with `@react-pdf/renderer` via `renderToBuffer` and streamed directly to the client; never persisted to disk or cloud storage.
   - Enforces mathematical identity: Subtotal, 5% GST, and PDF total strictly match `Invoice.total`.
4. **Role Guardrails**:
   - `ADMIN`, `ACCOUNTS`: Can record payments and download any invoice PDF.
   - `STORE`, `SUPERVISOR`, `QC`: Read-only access to invoices.
   - `BUYER`: Can only view and download invoice PDFs belonging to their own associated `buyerId`.

### Exported Signatures
```typescript
export async function getInvoicesList(filters?: InvoiceListFilters): Promise<PaginatedInvoices>;
export async function getInvoiceDetail(id: string): Promise<InvoiceDetail | null>;
export async function recordPayment(input: RecordPaymentInput): Promise<RecordPaymentResult>;
export async function getReceivablesTotal(): Promise<{ totalReceivables: number; overdueCount: number; overdueTotal: number }>;
export async function getInvoiceSummary(month?: string): Promise<{ totalBilled: number; totalCollected: number; invoiceCount: number }>;
```

---

## 9. Workforce & Expenses (`src/services/hr.ts` & `src/services/expenses.ts`)

Handles mill floor worker shifts, attendance roster, overtime tracking, monthly wages finalisation, and operational expense logs.

### Rules & Enforcements
1. **Attendance Roster**:
   - Bulk upsert on `(workerId, date, shift)` enables idempotent floor entries.
   - Defaults: Regular shift = 8 hours, overtime = 0 hours.
2. **Wages Calculation**:
   - Gross formula: $\text{gross} = \text{dailyRate} \times \text{daysPresent} + \text{otRatePerHour} \times \text{overtimeHours}$.
   - Finalisation: Idempotent write to `WageRecord` (unique `workerId + month`). Shows a locked state once finalised and refuses to run twice.
3. **Operational Expenses**:
   - Categorised into `ELECTRICITY`, `MAINTENANCE`, `TRANSPORT`, `RENT`, and `OTHER`.
   - Optional link to `Order` for product-level gross margin allocations.
4. **Finance Integration**:
   - `getMonthlyWagesTotal(month)`: Uses finalised records if present, otherwise computed dynamically from attendance.
   - `getMonthlyExpensesTotal(month)`: Summarises all operational overhead for the month.
5. **Role Guardrails**:
   - `SUPERVISOR`, `ADMIN`: Mark daily attendance.
   - `ACCOUNTS`, `ADMIN`: Finalise wages and record expenses.
   - `STORE`: Read-only attendance and expenses access.

### Exported Signatures
```typescript
// HR & Wages
export async function getAttendanceForShift(dateStr: string, shift: Shift): Promise<DayAttendanceData>;
export async function saveBulkAttendance(input: BulkAttendanceInput): Promise<{ count: number }>;
export async function getMonthlyAttendanceSummary(month: string): Promise<WorkerMonthlyAttendance[]>;
export async function getMonthlyWages(month: string): Promise<MonthlyWagesResult>;
export async function finaliseMonthWages(month: string): Promise<{ count: number; totalGross: number }>;
export async function getMonthlyWagesTotal(month: string): Promise<number>;

// Expenses
export async function getExpensesList(input: ExpenseListFilterInput): Promise<PaginatedExpenses>;
export async function createExpense(input: CreateExpenseInput): Promise<ExpenseItem>;
export async function getMonthlyExpensesTotal(month?: string): Promise<number>;
```
