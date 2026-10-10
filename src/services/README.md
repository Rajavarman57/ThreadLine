# Threadline Services Layer

All business logic in Threadline is centralized within `src/services/`. Threadline serves as the internal operations platform for Everest Textile Mills. Server actions and route handlers act as controllers and must delegate execution to these service contracts.

## Service Contract Table

| Module | Function Signature | Description |
| :--- | :--- | :--- |
| **Inventory** | `getAvailableStock(yarnTypeId: string): Promise<number>` | Calculates net available stock from `StockMovement` ledger for a given yarn type. |
| | `issueYarnToWorkOrder(workOrderId: string, yarnTypeId: string, qty: number): Promise<void>` | Records stock issuance movement linked to an active work order. |
| | `checkFeasibility(input: FeasibilityInput): Promise<FeasibilityResult>` | Validates material availability against work order BOM requirements. |
| | `reserveYarn(orderId: string): Promise<ReservationResult>` | Creates soft or allocated reservations for scheduled orders. |
| **Production** | `getMachineOutput(from: Date, to: Date): Promise<MachineOutputSummary[]>` | Aggregates produced roll counts and kilogram output per machine across a date window. |
| **Tracking** | `getOrderTracking(orderNo: string): Promise<OrderTrackingTimeline>` | Generates end-to-end timeline across Yarn -> Weaving/Dyeing -> QC -> Dispatch -> Invoicing. |
| **Dispatch** | `createDispatch(orderId: string, rollIds: string[], vehicle: string, driver: string): Promise<DispatchRecord>` | Finalizes packing slip and dispatch manifest. Validates that rolls meet dispatch criteria. |
| **Finance** | `getOrderCost(orderId: string): Promise<OrderCostBreakdown>` | Calculates comprehensive cost (raw material, labor, machine hours, overhead) for an order. |
| | `getMonthlyPnL(month: string): Promise<MonthlyPnLSummary>` | Generates profit and loss metrics comparing invoiced revenue against order expenses. |

## Critical Dispatch Rule
> [!IMPORTANT]
> **`Roll.qcStatus = PASSED` is the ONLY dispatchable state.**  
> Any attempt to include rolls with statuses `PENDING`, `REJECTED`, `REWORK`, or `HOLD` in `createDispatch(...)` must fail validation and throw an error.
