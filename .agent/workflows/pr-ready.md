# Workflow: PR Ready Verification

## Objective
Verify code quality, typing, test coverage, and security guardrails before submitting code for pull request review.

## Steps
1. **Automated Checks**:
   - Run typecheck: `npm run typecheck`
   - Run linter: `npm run lint`
   - Run unit/integration tests: `npm test`
   - Run production build: `npm run build`
2. **Architecture & Security Audit**:
   - Verify that all database list queries use indexed pagination (`take`, `skip`/cursor) with no unbounded `findMany`.
   - Verify that all server action inputs and route handlers strictly enforce Zod validation schemas.
   - Verify that all server actions and protected routes call `requireRole(...)`.
   - Verify that stock changes are mediated strictly through `StockMovement` rows.
3. **Report & Test Checklist**:
   - Print a clear summary of all executed checks.
   - Print a manual test checklist for reviewer verification.
4. **Hard Constraint**:
   - Do **NOT** run `git commit` or `git push`. The human developer commits and pushes code.
