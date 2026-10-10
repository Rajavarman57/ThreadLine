# Workflow: New Module Scaffolding

## Objective
Design and implement a new system module compliant with Threadline architecture and ownership rules.

## Steps
1. **Planning & Alignment**:
   - Identify module domain, owner (Person A, B, C, or D), and relevant database models.
   - Draft the module plan:
     - Service functions in `src/services/<module>.ts`
     - Zod schemas in `src/lib/schemas/<module>.ts`
     - Server actions with `requireRole(...)`
     - UI pages in `src/app/(dashboard)/<module>` with loading, empty, and error states
   - **Wait for user review and explicit approval before writing code**.
2. **Implementation**:
   - Implement business logic exclusively in `src/services/<module>.ts`.
   - Wrap multi-table database operations inside `prisma.$transaction`.
   - Ensure stock adjustments only write through `StockMovement`.
   - Implement server actions with role verification and input validation.
   - Build mobile-first UI pages utilizing shadcn/ui components and SWR data fetching.
3. **Verification**:
   - Add unit tests with Vitest.
   - Verify pagination, caching headers, and polling limits (>= 60s/120s).
