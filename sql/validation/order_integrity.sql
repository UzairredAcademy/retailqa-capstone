-- Order Data Integrity (P0)
-- File: sql/validation/order_integrity.sql
-- Preconditions: Test DB seeded via sql/setup; read-only account; run after the related UI/API tests
-- Table names are placeholders - rename to match the real schema.

-- =============================================================
-- T-DB-ORD-001: Every order has a valid customer and at least one line item (no orphans)
-- Covers: FR-007-AC2, FR-007-AC3 | Integrity
-- Purpose / approach:
--   1. Query orders with no matching customer
--   2. Query orders with no order lines
--   3. Query order lines with no parent order
-- Expected result: 0 rows returned for each check (no violations)
-- TODO: write the query below.
;

-- =============================================================
-- T-DB-ORD-002: Order total equals SUM(line total) + tax - discount
-- Covers: FR-002-AC2, FR-007-AC4 | Integrity
-- Purpose / approach:
--   1. Join Orders to aggregated OrderItems
--   2. Return orders where the stored total differs from the recomputed total
-- Expected result: 0 rows returned (difference = 0.00 for all orders)
-- TODO: write the query below.
;

-- =============================================================
-- T-DB-ORD-003: No duplicate orders exist for the same idempotency key or identical cart in a short window
-- Covers: FR-002-AC7 | Integrity
-- Purpose / approach:
--   1. Group by customer + idempotency key
--   2. Group by customer + item set within 5 seconds
--   3. Return groups with count > 1
-- Expected result: 0 rows returned
-- TODO: write the query below.
;

-- =============================================================
-- T-DB-ORD-004: Cancelled orders have cancel timestamps and paid orders were not modified after payment
-- Covers: FR-002-AC5, FR-002-AC6 | Integrity
-- Purpose / approach:
--   1. Find Cancelled orders with a null cancelled_at
--   2. Find orders whose modified_at is later than paid_at
--   3. Find cancelled orders still holding reserved stock
-- Expected result: 0 rows returned for each check
-- TODO: write the query below.
;
