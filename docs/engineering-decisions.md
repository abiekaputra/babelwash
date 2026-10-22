# Engineering decisions

## Enforce workflow twice where it matters

The domain model is the primary authority for transitions and payment rules. SQLite separately enforces structural facts such as positive quantity, nonnegative money, known roles, and foreign-key ownership. The database does not duplicate the full state machine because that would split workflow policy across two implementations.

## Keep currency integral

Every price and payment is stored as integer rupiah. Quantity may be fractional for kilogram services, but the service calculation rounds once into a `Money` value. This avoids binary floating-point balances and keeps API/database representation clear.

## Audit changes instead of overwriting history

An order status update changes the current row and adds a status event in the same transaction. Inventory adjustments change current quantity and add a movement with actor and reason. The current view stays fast while the event history remains available for explanations and future reporting.

## Make tracking useful without making it a data leak

The public endpoint is intentionally separate from the authenticated order detail. It accepts only a high-entropy tracking code and returns a masked name, service, timing, state, and timeline. Contact details, payment records, internal notes, users, and inventory never enter its response.

## Prefer a modal to native browser prompts

Payment originally used sequential browser prompts. User-perspective validation showed that the flow felt detached from the order and made validation awkward. A dedicated dialog now presents the balance, method, amount, cancellation, validation, and confirmation together.

## Accept local boundaries explicitly

SQLite and seeded demonstration identities make the complete product reproducible without paid infrastructure. This is appropriate for a local portfolio release, but it is not a production deployment claim. The README records the missing operational work instead of hiding it behind an architecture diagram.
