-- Inventory Consistency (P0)
-- File: sql/validation/inventory_consistency.sql
-- Preconditions: Test DB seeded via sql/setup; read-only account; run after the related UI/API tests
-- Table names are placeholders - rename to match the real schema.

-- =============================================================
-- T-DB-INV-001: Stock on hand is never negative
-- Covers: FR-002-AC1 | Integrity
-- Purpose / approach:
--   1. Query inventory rows where quantity_on_hand < 0
-- Expected result: 0 rows returned
-- TODO: write the query below.
;

-- =============================================================
-- T-DB-INV-002: Stock movements reconcile: opening stock + ledger entries = current stock
-- Covers: FR-007-AC2, FR-007-AC4 | Reconciliation
-- Purpose / approach:
--   1. For each SKU compute opening stock + SUM(ledger quantity)
--   2. Compare with the current on-hand figure
-- Expected result: 0 rows returned (difference = 0 for every SKU)
-- TODO: write the query below.
;

-- =============================================================
-- T-DB-INV-003: Cancelling an order releases its reserved/sold stock
-- Covers: FR-002-AC6 | Integrity
-- Purpose / approach:
--   1. For each Cancelled order, SUM ledger entries per SKU
--   2. Verify a compensating positive entry equals the ordered quantity
-- Expected result: 0 rows returned (net ledger effect of a cancelled order is 0)
-- TODO: write the query below.
;

-- =============================================================
-- T-DB-INV-004: Return receipt restores stock for the returned quantity
-- Covers: FR-005-AC4 | Integrity
-- Purpose / approach:
--   1. For each received return line, find the matching ledger entry
--   2. Compare quantities
-- Expected result: 0 rows returned (every received return has a matching positive ledger entry)
-- TODO: write the query below.
;
