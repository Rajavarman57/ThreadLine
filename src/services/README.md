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
