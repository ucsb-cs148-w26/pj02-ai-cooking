# TESTING

## Testing Library / Approach Experimented With

Library used: Vitest
Why we picked it: it is simple to set up, works well with TypeScript, and runs fast for unit tests.
Team testing approach: start with small unit tests on deterministic service functions first, then expand to API and component tests with mocks as needed.

## Unit Test Implemented

Test file: `Project/services/expirationDateService.test.ts`
Function tested: `isValidDate(dateString: string)`
What this unit test checks:
valid ISO date format (`YYYY-MM-DD`) returns true
non-ISO formats return false
impossible month values return false
impossible day values return false
leap year behavior (`2024-02-29` is valid, `2025-02-29` is invalid)

## How to Run

From `Project/`:

```bash
npm test
```

Optional:

```bash
npm run test:watch
```
