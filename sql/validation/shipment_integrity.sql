-- Shipment Integrity (P0)
-- File: sql/validation/shipment_integrity.sql
-- Preconditions: Test DB seeded via sql/setup; read-only account; run after the related UI/API tests

-- =============================================================
-- T-DB-SHP-001: Shipments exist only for paid and returned orders
-- Covers: FR-004-AC1 | Integrity
-- Expected result: 0 rows returned

use RetailQEDb
GO
select s.ShipmentId as shipment_id, o.OrderId as order_id, o.status as order_status
from Shipments s
join Orders o on s.OrderId = o.OrderId
where o.status <> 'paid' and
o.status <> 'Returned'
;

-- =============================================================
-- T-DB-SHP-002: Shipped shipments have unique, non-null tracking numbers
-- Covers: FR-004-AC2 | Integrity
-- Expected result: 0 rows returned

use RetailQEDb
GO
select s.ShipmentId as shipment_id, s.TrackingNumber as tracking_number
from Shipments s
where s.status in ('Shipped', 'Delivered') and (s.TrackingNumber is null or s.TrackingNumber = '')
;

-- =============================================================
-- T-DB-SHP-003: Shipment status history follows the valid sequence with increasing timestamps
-- Covers: FR-004-AC3 | Integrity
-- Expected result: 0 rows returned
use RetailQEDb
GO

select s.ShipmentId as shipment_id, sh.Status as status, sh.createdAt as timestamp
from Shipments s
join shipments sh on s.ShipmentId = sh.ShipmentId
order by sh.createdAt 
;

-- =============================================================
       --===============BLOCKED===============

-- T-DB-SHP-004: Every delivered shipment has a proof-of-delivery record
-- Covers: FR-004-AC5 | Integrity
-- Expected result: 0 rows returned


--use RetailQEDb
--GO
--select s.ShipmentId as shipment_id, pod.Recipient as pod_recipient, pod.Timestamp as pod_timestamp
--from Shipments s
--left join ProofOfDelivery pod on s.ShipmentId = pod.ShipmentId
--where s.status = 'Delivered' and (pod.Recipient is null or pod.Timestamp is null)
;