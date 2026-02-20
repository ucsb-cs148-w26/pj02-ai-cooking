# TESTING

## 1) Unit Test Requirement (Previous Lab)

### Library + Setup
- Library used: **Vitest**
- Why: lightweight, TypeScript-friendly, and easy to run in our Next.js project.

### Unit Test Implemented
- Test file: `Project/services/expirationDateService.test.ts`
- Code under test: `isValidDate(dateString: string)` in `Project/services/expirationDateService.ts`
- Assertions currently included:
  - valid ISO format (`YYYY-MM-DD`) returns `true`
  - non-ISO formats return `false`
  - impossible month/day values return `false`
  - leap year behavior is correct (`2024-02-29` valid, `2025-02-29` invalid)

## 2) Unit Test Plans Going Forward

Our current unit-test strategy is focused and incremental (not "test everything immediately"):
- Prioritize deterministic logic first (date parsing/validation, data transforms, utility logic).
- Add unit tests for service helpers before UI-only concerns.
- For API code that depends on external LLM/services, we will prefer mocked integration tests over brittle unit tests of third-party behavior.

Reasoning:
- This gives us fast confidence on core logic with low maintenance overhead.
- It avoids spending large effort on fragile tests that mostly re-test library internals.

## 3) Higher-Level Testing Requirement (This Lab)

### Library + Setup
- Added **React Testing Library** (with Vitest + `jsdom`) for component-level testing.
- Added `Project/vitest.config.ts` to:
  - run tests in a browser-like `jsdom` environment
  - resolve the `@/` alias used in project imports

### Component/Integration Test Implemented
- Test file: `Project/components/ExpirationReminders.test.tsx`
- Component(s) covered:
  - `ExpirationReminders`
  - integration with child component `ExpirationProgressBar`
- Test scenarios implemented:
  - empty-state rendering when pantry has no items
  - sorting behavior (soonest expiration appears first)
  - integration behavior where clicking **Delete** triggers `onDelete` with the correct item id

This satisfies the higher-level testing requirement because it verifies rendered UI behavior and parent-child interaction, not just isolated pure-function logic.

## 4) Higher-Level Testing Plans Going Forward

Planned next steps (incremental rollout):
- Add component tests for high-impact user flows (`OnboardingForm`, inventory input behavior, and reminder states).
- Add integration tests for API routes with mocked external providers (`/api/gemini/recipes`, `/api/gemini/scan`).
- Keep full end-to-end tests as optional for now due time/cost; prioritize component + API integration coverage first.

Reasoning:
- Component + integration tests catch real regressions in behavior while staying maintainable for our team size.
- Full E2E can be added later for critical flows once feature scope stabilizes.

## Commands

From `Project/`:

```bash
npm test
```

Optional:

```bash
npm run test:watch
npm run test:unit
npm run test:component
```
