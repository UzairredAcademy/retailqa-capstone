-- Payment Data Integrity (P0)
-- File: sql/validation/payment_integrity.sql
-- Preconditions: Test DB seeded via sql/setup; read-only account; run after the related UI/API tests
-- Table names are placeholders - rename to match the real schema.

-- =============================================================
-- T-DB-PAY-001: Every paid order has exactly one successful payment
-- Covers: FR-003-AC4 | Integrity
-- Purpose / approach:
--   1. Count successful payments per paid order
--   2. Return orders with a count other than 1
--   3. Return successful payments for non-paid orders
-- Expected result: 0 rows returned
-- TODO: write the query below.
;

-- =============================================================
-- T-DB-PAY-002: Successful payment amount equals the order total and no payment is orphaned
-- Covers: FR-003-AC2, FR-007-AC4 | Integrity
-- Purpose / approach:
--   1. Compare Payments.amount to Orders.total for successful payments
--   2. Find payments with no order
-- Expected result: 0 rows returned
-- TODO: write the query below.
;

-- =============================================================
-- T-DB-PAY-003: Declined payments never mark an order as paid and always store a decline reason
-- Covers: FR-003-AC3 | Integrity
-- Purpose / approach:
--   1. Find declined payments whose order is Paid with no other successful payment
--   2. Find declined payments with a null reason code
-- Expected result: 0 rows returned
-- TODO: write the query below.
;

-- =============================================================
-- T-DB-PAY-004: Refunds never exceed the amount paid and reference the original payment method
-- Covers: FR-003-AC5, FR-005-AC3 | Integrity
-- Purpose / approach:
--   1. SUM refunds per payment and compare with the amount paid
--   2. Find refunds whose method differs from the original payment method
-- Expected result: 0 rows returned
-- TODO: write the query below.
;
