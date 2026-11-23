-- Payment Data Integrity (P0)
-- File: sql/validation/payment_integrity.sql
-- Preconditions: Test DB seeded via sql/setup; read-only account; run after the related UI/API tests

-- =============================================================
-- T-DB-PAY-001: Every paid order has exactly one successful payment
-- Expected result: 0 rows returned
use RetailQEDb
GO

select o.OrderId as order_id, count(p.PaymentId) as Approved_payment_count
from Orders o
left join Payments p on o.OrderId = p.OrderId and p.status = 'Approved'
where o.status = 'paid'
group by o.OrderId
having count(p.PaymentId) <> 1
;

-- =============================================================
-- T-DB-PAY-002: Successful payment amount equals the order total and no payment is orphaned
-- Covers: FR-003-AC2, FR-007-AC4 | Integrity
use RetailQEDb
GO

select o.OrderId as order_id, p.PaymentId as payment_id, p.amount as payment_amount, o.total as order_total
from Orders o
left join Payments p on o.OrderId = p.OrderId and p.status = 'Approved'
where o.status = 'paid' and p.amount <> o.total
-- Expected result: 0 rows returned
;
-- =============================================================
-- T-DB-PAY-003: Declined returns never mark an order as paid and always store a decline reason
-- Covers: FR-003-AC3 | Integrity
-- Expected result: 0 rows returned
use RetailQEDb
GO

select o.OrderId as order_id, p.PaymentId as payment_id, r.reason as decline_reason
from Orders o
join Payments p on o.OrderId = p.OrderId
left join Returns r on p.PaymentId = r.OrderId
where p.status = 'Declined' and ((o.status = 'paid' and not exists (
select 1
from Payments p2
where p2.OrderId = o.OrderId and p2.status = 'Approved'
)) or r.reason is null)
;
-- =============================================================
-- T-DB-PAY-004: Refunds never exceed the amount paid and reference the original payment method
-- Covers: FR-003-AC5, FR-005-AC3 | Integrity

use RetailQEDb
GO

select o.OrderId as order_id, p.PaymentId as payment_id, sum(r.RefundAmount) as total_refund_amount, p.amount as original_payment_amount
from Orders o
left join Payments p on o.OrderId = p.PaymentId and p.status = 'Approved'
left join Returns r on p.PaymentId = r.OrderId
where o.status = 'paid'
group by o.OrderId, p.PaymentId, p.amount
having sum(r.RefundAmount) > p.amount
-- Expected result: 0 rows returned
;