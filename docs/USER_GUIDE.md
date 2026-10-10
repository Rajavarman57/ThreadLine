# Everest Textile Mills · User Guide by Role

Welcome to the **Everest Textile Mills Operating Guide**. This manual outlines key day-to-day screens and standard operating procedures (SOPs) based on assigned mill personnel roles.

---

## 1. Storekeeper (`STORE`)
**Primary Responsibilities**: Raw yarn receiving, warehouse stock counts, purchase orders, and outbound loading.

### Everyday Screens:
1. **/inventory/receipts/new**:
   - Record newly delivered raw yarn from suppliers.
   - Enter lot numbers, gross weight (KG), unit purchase rates, and attach supplier delivery challan notes.
2. **/inventory**:
   - Monitor live warehouse on-hand stock vs reserved quantities for scheduled orders.
   - Investigate low-stock alerts before machines face starvation.
3. **/inventory/movements**:
   - Complete audit trail of yarn inflows (`RECEIPT`) and floor floor issuances (`ISSUE`).
4. **/dispatch**:
   - View finished goods rolls packed and ready for loading.
   - Assist in loading onto delivery transport trucks.

---

## 2. Production Supervisor (`SUPERVISOR`)
**Primary Responsibilities**: Shift planning, machine floor board, work order execution, worker attendance, and machine maintenance.

### Everyday Screens:
1. **/production/plan**:
   - Review incoming confirmed sales orders.
   - Allocate idle spinning frames, weaving looms, and dyeing vats to generate stage work orders.
2. **/production**:
   - Real-time machine board colour-coded by status (Green: Running, Grey: Idle, Amber: Maintenance, Red: Breakdown).
   - Log breakdown reasons immediately to notify admin and maintenance technicians.
3. **/production/work-orders**:
   - Log hourly production metre output, active operators, and shift (A/B/C).
   - Floor issuance of raw yarn automatically deductions from inventory in proportion to output.
4. **/hr**:
   - Select today's date and active shift (Shift A, B, or C).
   - Toggle worker presence, verify standard 8 hours, log overtime, and click **Save Shift Attendance**.

---

## 3. Quality Inspector (`QC`)
**Primary Responsibilities**: Roll inspection, grading defect checklists, QR roll tagging, and defect analytics.

### Everyday Screens:
1. **/quality**:
   - Live queue of newly produced rolls waiting for quality inspection.
2. **/quality/inspect/[rollNo]**:
   - Inspect physical fabric rolls against defect categories (holes, colour mismatch, uneven weaving, stains).
   - Assign severity (`minor`, `major`, `critical`) and record decision: `PASS`, `REWORK`, or `REJECT`.
3. **/quality/rolls/[rollNo]**:
   - Roll provenance trace with digital QR code linking to manufacturing genealogy.
   - Print roll identification tags via `/quality/rolls/[rollNo]/label`.
4. **/quality/analytics**:
   - Monitor rolling weekly pass rate trends and identify machines producing repeat defects.

---

## 4. Accounts Executive (`ACCOUNTS`)
**Primary Responsibilities**: Sales order billing, payment reconciliations, payroll wages, and operating expenses.

### Everyday Screens:
1. **/dispatch/invoices**:
   - Review tax invoices generated automatically upon shipment dispatch.
   - Track invoice aging in days and flag accounts overdue past 30 days.
   - Download dynamic on-the-fly GST tax invoice PDFs.
2. **/dispatch/invoices/[id]**:
   - Open invoice overview and click **Record Payment** to log customer inflows (Bank, UPI, RTGS, Cheque, Cash).
3. **/hr/wages**:
   - Select payroll month, inspect worker man-days and overtime earnings.
   - Export CSV register and click **Finalise Month Wages** to freeze immutable accounts records.
4. **/expenses**:
   - Log operational expenditure across electricity power, machine spares, logistics, and factory rent.

---

## 5. Plant Director & Admin (`ADMIN`)
**Primary Responsibilities**: Complete mill visibility, executive decision making, master catalogs, and financial health.

### Everyday Screens:
1. **/finance**:
   - Commercial executive dashboard: Monthly net operating profit, billed revenues, labor expenditure, and outstanding accounts receivable.
   - Monitor operational watchlists: at-risk delivery deadlines, low raw yarn stocks, and broken machines.
2. **/finance/costing**:
   - Job costing per sales order: direct yarn consumption + machine hourly overheads + labor share.
   - Evaluate product-level gross profit margins.
3. **/finance/pnl**:
   - Formal monthly P&L statement with prior-month growth comparisons.
4. **/finance/summary**:
   - Formal executive monthly statement designed for hardcopy printing.
5. **/master**:
   - Manage master catalogs: Yarn Types, Bill of Materials (BOM), Machines, Buyers, and Suppliers.

---

## 6. Textile Buyer Client (`BUYER`)
**Primary Responsibilities**: Private client order monitoring and shipment tracking.

### Everyday Screens:
1. **/portal**:
   - Private self-service buyer portal displaying current production orders, manufacturing stages, and delivery progress bars.
2. **/portal/orders/[orderNo]**:
   - Live 7-stage manufacturing stepper (Confirmed $\rightarrow$ Spinning $\rightarrow$ Weaving $\rightarrow$ Dyeing $\rightarrow$ QC $\rightarrow$ Ready $\rightarrow$ Dispatched).
   - View delivery vehicle numbers, driver details, and download official tax invoice PDFs.
