# Everest Textile Mills · ERP Architecture & Operations Guide

ThreadLine is a full-stack enterprise manufacturing and logistics ERP built specifically for **Everest Textile Mills**. It automates end-to-end mill operations across raw yarn procurement, warehouse inventory, multi-stage factory production (Spinning, Weaving, Dyeing), roll-level quality grading, finished goods dispatch, and commercial finance reporting.

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Client Applications"]
        Browser["Desktop & Mobile Browsers"]
        PublicTrack["Public Tracker (/track)"]
        BuyerPortal["Buyer Portal (/portal)"]
        Scanner["QR Code Roll Scanner"]
    end

    subgraph AppServer["Next.js App Router (Vercel)"]
        direction TB
        Auth["Auth.js (NextAuth v5)"]
        Middleware["Role-Based Route Guards"]
        API["REST & Streaming Routes (/api)"]
        AppRoutes["Server Components & Client Pages"]
        PDFGen["@react-pdf/renderer (On-the-Fly PDF)"]
    end

    subgraph Services["Domain Service Layer (src/services)"]
        Inventory["Inventory & Stock Ledger"]
        Master["Master Catalogs & BOM"]
        Orders["Sales Orders & Feasibility"]
        Production["Machine Board & Work Orders"]
        Quality["QC Inspections & Traceability"]
        Dispatch["Race-Safe Logistics & Manifests"]
        Payments["Invoices & Payment Allocation"]
        HR["Shift Attendance & Wages"]
        Expenses["Operational Expenses"]
        Finance["Job Costing, P&L & Analytics"]
        Tracking["Order Stepper & ETA Engine"]
        Notifications["Lazy System Notifications"]
    end

    subgraph DataTier["Data Tier"]
        Prisma["Prisma ORM 6.19"]
        NeonDB[("Neon Serverless PostgreSQL")]
    end

    Browser --> Auth
    PublicTrack --> Tracking
    BuyerPortal --> Tracking
    Scanner --> Quality

    Auth --> Middleware
    Middleware --> AppRoutes
    AppRoutes --> Services
    API --> Services
    Services --> Prisma
    Prisma --> NeonDB
    Services --> PDFGen
```

---

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o{ AuditLog : logs
    User ||--o{ Notification : receives
    User ||--o{ GoodsReceipt : creates
    User ||--o{ StockMovement : records
    User ||--o{ ProductionLog : operates
    User ||--o{ QCInspection : inspects
    Buyer ||--o{ User : contacts
    Buyer ||--o{ Order : places

    Supplier ||--o{ PurchaseOrder : supplies
    PurchaseOrder ||--o{ PurchaseLine : contains
    YarnType ||--o{ PurchaseLine : items
    YarnType ||--o{ StockMovement : tracks
    YarnType ||--o{ GoodsReceipt : receives
    YarnType ||--o{ BOM : defines

    Order ||--o{ WorkOrder : schedules
    Order ||--o{ Roll : produces
    Order ||--o{ Dispatch : fulfills
    Order ||--o{ Expense : allocates

    Machine ||--o{ WorkOrder : executes
    Machine ||--o{ Roll : processes
    WorkOrder ||--o{ ProductionLog : logs
    WorkOrder ||--o{ Roll : generates

    Roll ||--o{ QCInspection : checks
    Roll ||--o| DispatchLine : claims
    Dispatch ||--o{ DispatchLine : packs
    Dispatch ||--o| Invoice : generates
    Invoice ||--o{ Payment : clears

    Worker ||--o{ Attendance : marks
    Worker ||--o{ WageRecord : pays
```

---

## 3. Role-Based Permissions Matrix

| Module / Action | ADMIN | STORE | SUPERVISOR | QC | ACCOUNTS | BUYER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Raw Yarn Receipts & Stock Ledger** | ✅ | ✅ | Read | Read | Read | ❌ |
| **Master Data (Suppliers, Machines, BOM)** | ✅ | ✅ | Read | Read | Read | ❌ |
| **Sales Orders & Feasibility** | ✅ | Read | Read | Read | ✅ | ❌ |
| **Production Planning & Work Orders** | ✅ | Read | ✅ | Read | Read | ❌ |
| **Machine Breakdown / Resume Actions** | ✅ | Read | ✅ | Read | Read | ❌ |
| **Quality Inspection & Defect Grading** | ✅ | Read | Read | ✅ | Read | ❌ |
| **Dispatch Manifest & Vehicle Outward** | ✅ | ✅ | Read | Read | ✅ | ❌ |
| **Tax Invoices & Payment Recording** | ✅ | Read | Read | Read | ✅ | ❌ |
| **Shift Attendance & Overtime** | ✅ | Read | ✅ | Read | Read | ❌ |
| **Monthly Wages Finalisation** | ✅ | Read | Read | Read | ✅ | ❌ |
| **Operational Expenses Tracking** | ✅ | Read | Read | Read | ✅ | ❌ |
| **Costing, P&L & Owner Dashboard** | ✅ | ❌ | Read | ❌ | ✅ | ❌ |
| **Private Buyer Portal (`/portal`)** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Public Order Tracker (`/track`)** | Public | Public | Public | Public | Public | Public |

---

## 4. Local Development Setup

### Prerequisites
- Node.js `20.x` or `24.x`
- Git

### Environment Variables (`.env.local`)
Create `.env.local` containing:
```bash
DATABASE_URL="postgresql://user:password@endpoint-pooler.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"
AUTH_SECRET="your-32-byte-hex-or-base64-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Installation & Migration
```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Seed starter accounts & factory data
npx prisma db seed

# 4. Start local development server
npm run dev
```

---

## 5. Operations & Production Runbook

### Vercel Deployment with Neon PostgreSQL
1. Link project to Vercel:
   ```bash
   npx vercel link
   ```
2. Configure Environment Variables in Vercel Dashboard:
   - `DATABASE_URL` (Neon pooling endpoint)
   - `DIRECT_URL` (Neon direct endpoint)
   - `AUTH_SECRET`
   - `NEXTAUTH_URL`
3. Deploy to production:
   ```bash
   npx vercel --prod --yes
   ```

### Neon Database Backups
- Neon provides continuous point-in-time recovery (PITR) automatically.
- To take an instant manual branch snapshot before major updates:
  ```bash
  npx neonctl branches create --name pre-release-snapshot
  ```

### Rotating `AUTH_SECRET`
1. Generate new 32-byte secret:
   ```bash
   openssl rand -base64 32
   ```
2. Update `AUTH_SECRET` in Vercel Environment Variables.
3. Redeploy application without downtime. Active sessions will re-authenticate gracefully via JWT validation.

### Resetting Mill Sample Data
To wipe and reset factory demo data back to clean seeds:
```bash
npx prisma db push --force-reset
npm run db:seed
```
