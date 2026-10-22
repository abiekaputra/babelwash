# Testing and end-user validation

## Automated test layers

### Domain tests

- minimum service quantity affects price;
- service turnaround determines due time;
- invalid status jumps fail;
- collection before full payment fails;
- overpayment fails; and
- inventory reaches reorder state without allowing negative stock.

### API integration tests

- unauthenticated access to the queue is rejected;
- a full order, status, payment, collection, and public-tracking sequence succeeds;
- the public endpoint masks the customer name;
- an owner stock adjustment is persisted; and
- a stock movement that would create a negative quantity fails.

Each API run receives a temporary SQLite directory and removes it after the application closes. Tests do not share the development database.

### Browser end-to-end test

Playwright starts at the same login page as a user and performs this journey:

1. enter the demo owner workspace;
2. create a wash-and-iron order with a care note;
3. move it through washing, drying, and ready;
4. record payment through the visible modal;
5. inspect the updated operational dashboard;
6. open customer tracking and query the generated code;
7. inspect the inventory page; and
8. verify the dashboard at a 390 × 844 mobile viewport.

The screenshots in `docs/images` are generated during this journey. They are evidence from the running application, not static mockups.

## Commands

```bash
# Formatting, line limits, lint, types, 8 domain/API tests, production build
pnpm quality

# First browser setup on a machine
pnpm exec playwright install chromium

# Deterministic browser journey and screenshots
BABELWASH_RESET_DATABASE=true pnpm test:e2e
```

## Manual review checklist

- Error copy states what the user can correct.
- The payment dialog remains in product context and supports keyboard focus.
- Success feedback is centered and readable without covering navigation.
- Owner-only inventory controls are absent from a staff session.
- Public tracking exposes no phone number, payment detail, or unmasked name.
- Navigation remains usable at desktop and mobile viewport sizes.
- Every screenshot matches an implemented path in the browser test.
