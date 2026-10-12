-- Audit & Compliance (P0)
-- File: sql/validation/audit_compliance.sql
-- Preconditions: Test DB seeded via sql/setup; read-only account; run after the related UI/API tests
-- Table names are placeholders - rename to match the real schema.

-- =============================================================
-- T-DB-AUD-001: Audit log has entries for order, payment and status changes
-- Covers: FR-005-AC5 | Compliance
-- Purpose / approach:
--   1. For recent orders, count audit rows for order created, payment and shipment status changes
--   2. Return entities with missing events
-- Expected result: 0 rows returned; each audit row has an actor, action, entity id and timestamp
-- TODO: write the query below.
;

-- =============================================================
-- T-DB-AUD-002: Return audit trail is complete: requested, received and refunded
-- Covers: FR-005-AC5 | Compliance
-- Purpose / approach:
--   1. For each completed return, list audit events in order
--   2. Return returns missing any required event or with out-of-order events
-- Expected result: 0 rows returned
-- TODO: write the query below.
;

-- =============================================================
-- T-DB-AUD-003: Shipped and delivered notifications are logged for each shipment
-- Covers: FR-004-AC4 | Compliance
-- Purpose / approach:
--   1. For each Shipped/Delivered shipment find the SMS/email log entries
--   2. Return shipments with no notification
-- Expected result: 0 rows returned
-- TODO: write the query below.
;

-- =============================================================
-- T-DB-AUD-004: No partially completed transactions exist (all-or-nothing)
-- Covers: FR-007-AC3 | Integrity
-- Purpose / approach:
--   1. Find Paid orders with no payment
--   2. Find payments with no order
--   3. Find orders with items but with no stock ledger entry
--   4. Find shipments with no paid order
-- Expected result: 0 rows returned
-- TODO: write the query below.
;
