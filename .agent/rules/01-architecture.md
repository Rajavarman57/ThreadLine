# 01 - Architecture & Coding Standards

## Service Layer & Business Logic
- **Isolation**: All business logic lives strictly in `src/services/<module>.ts`. Server actions and API routes must act as thin controllers that delegate to these services.
- **Stock Movement Integrity**: Stock changes must occur **only** via `StockMovement` ledger records/rows. Never mutate stock balances via direct ad-hoc increments or decrements.
- **Transactions**: Multi-table writes must occur inside short `prisma.$transaction(...)` blocks with **no external network/API calls** inside the transaction closure.
- **Prisma Client**: Access the database singleton solely from `src/lib/db.ts`. Never instantiate new `PrismaClient` instances.

## Serverless Performance & Resource Efficiency
- **Database Pagination**: Every query returning a list must be paginated on indexed columns (`take`, `skip` / cursor). Never perform unbounded `findMany` queries.
- **Rendering & Prerendering**: Pages that read the database must be dynamic or configure `revalidate` (never prerender database data at build time).
- **Read-heavy Caching**: Read-heavy pages must use `revalidate = 30-60` seconds.
- **Public Tracking Endpoints**: Public tracking responses must set:
  ```http
  Cache-Control: public, s-maxage=30, stale-while-revalidate=60
  ```
- **SWR Polling Guardrails**:
  - Machine board and live tracking pages: SWR polling interval `>= 60s`.
  - All other dashboard pages: SWR polling interval `>= 120s` with `refreshWhenHidden: false`.
- **Blob / File Storage**: No file binaries or generated PDFs may be stored inside the database.

## Security & Validation
- **Input Validation**: Strict Zod validation on all input data (forms, server actions, route handlers).
- **Access Control**: Every server action and protected route must enforce authorization with `requireRole(...)`.

## User Interface Guidelines
- **Mobile-First**: Design responsive layouts starting from mobile viewport up to desktop workstations.
- **State Feedback**: Every view and data widget must provide distinct **loading**, **empty**, and **error** states.


## Server Component Serialization & Error Handling
- **Plain Serializable Data**: Server components must pass only plain serialisable data (strings, numbers, booleans, ISO date strings, plain objects and arrays) to client components.
- **Conversion at the Service Boundary**: Convert Prisma Decimal with a helper (`toNumber`) and Date with `toISOString` at the service boundary.
- **Client Components for Table & UI Functions**: TanStack table column definitions, cell renderers and any inline functions live inside `'use client'` files, never in `page.tsx`.
- **Never Swallow Errors**: Never swallow errors: log with `console.error` and rethrow or show an error state.
