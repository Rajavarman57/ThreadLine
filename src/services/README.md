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
