# Product scope

## Product statement

BabelWash is a local-first operations product for a small laundry business. It replaces fragmented paper and verbal handoffs with one controlled order journey that staff can operate from a browser and customers can inspect through a tracking code.

## Users

### Owner

- sees operational and revenue summaries;
- performs the same counter workflow as staff;
- adjusts inventory and records why stock changed; and
- responds to low-stock warnings.

### Staff

- receives garments and care instructions;
- advances orders through the actual wash workflow;
- records customer payments; and
- communicates a tracking code and collection readiness.

### Customer

- enters a tracking code without a staff account;
- sees the service, promised time, current state, and timeline; and
- receives only the information required to understand the order.

## Release acceptance criteria

The local portfolio release is complete when all of the following are true:

1. An owner or staff member can sign in from the browser.
2. Staff can create an order with a validated customer, service, quantity, and optional care note.
3. The system applies the service minimum when calculating price and derives the due time from its turnaround policy.
4. An order can only follow the configured status sequence.
5. Collection is blocked until full payment has been recorded.
6. A customer can read a privacy-reduced timeline using the generated tracking code.
7. An owner can adjust stock with an auditable reason, while staff cannot perform that mutation.
8. Stock cannot fall below zero and low quantities are visibly flagged.
9. Domain rules, protected API behavior, and failure cases have automated tests.
10. The complete staff-to-customer journey passes in a real browser at desktop and mobile viewport sizes.
11. A new developer can install and start the product from repository instructions.

All eleven criteria are implemented and validated in the current release.

## Outside this release

- Public cloud deployment and multi-tenant operation
- Real QRIS gateway confirmation
- WhatsApp or SMS notification delivery
- Receipt and label printer integration
- Production backup, restore, and retention automation
- Advanced accounting, promotions, delivery pickup, and franchise reporting

These are explicit product boundaries. Their absence is not represented as completed work in the repository or portfolio evidence.
