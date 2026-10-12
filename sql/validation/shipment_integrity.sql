-- Shipment Integrity (P0)
-- File: sql/validation/shipment_integrity.sql
-- Preconditions: Test DB seeded via sql/setup; read-only account; run after the related UI/API tests
-- Table names are placeholders - rename to match the real schema.

-- =============================================================
-- T-DB-SHP-001: Shipments exist only for paid orders
-- Covers: FR-004-AC1 | Integrity
-- Purpose / approach:
--   1. Join Shipments to Orders
--   2. Return shipments whose order is not paid or has no successful payment
-- Expected result: 0 rows returned
-- TODO: write the query below.
;

-- =============================================================
-- T-DB-SHP-002: Shipped shipments have unique, non-null tracking numbers
-- Covers: FR-004-AC2 | Integrity
-- Purpose / approach:
--   1. Find Shipped/Delivered shipments with a null or empty tracking number
--   2. Find duplicate tracking numbers
-- Expected result: 0 rows returned
-- TODO: write the query below.
;

-- =============================================================
-- T-DB-SHP-003: Shipment status history follows the valid sequence with increasing timestamps
-- Covers: FR-004-AC3 | Integrity
-- Purpose / approach:
--   1. Read the shipment status history ordered by timestamp
--   2. Find Delivered before Shipped
--   3. Find out-of-order timestamps
-- Expected result: 0 rows returned
-- TODO: write the query below.
;

-- =============================================================
-- T-DB-SHP-004: Every delivered shipment has a proof-of-delivery record
-- Covers: FR-004-AC5 | Integrity
-- Purpose / approach:
--   1. Find Delivered shipments with no POD row or with an empty recipient/timestamp
-- Expected result: 0 rows returned
-- TODO: write the query below.
;
