# Workflow: Verify Live Deployment

## Objective
Verify functionality against a live preview or production deployment without modifying code.

## Steps
1. **Request Details**:
   - Ask the user for the preview or production URL.
   - Ask for the specific verification checklist and credentials or seeded role to test with.
2. **Execute Interactive Verification**:
   - Use the browser agent to navigate to the provided deployment URL.
   - Log in using the specified seeded user role credentials.
   - Execute each checklist step sequentially as an authentic user would.
3. **Capture Evidence**:
   - Capture screenshots and recorded sessions demonstrating UI flow, responses, and edge states.
4. **Report Results**:
   - Provide a structured report with **PASS** / **FAIL** status for each step.
   - If a step fails, include the exact error message, relevant console logs, and network status codes.
5. **Constraint**:
   - Do **NOT** modify any code during this verification workflow.
