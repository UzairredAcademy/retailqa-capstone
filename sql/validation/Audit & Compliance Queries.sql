
--T-DB-AUD-001

--1. Orders with no audit entry
USE RetailQEDb;
SELECT o.OrderId
FROM Orders o
LEFT JOIN AuditLog a ON a.EntityType = 'Order' AND a.EntityId = o.OrderId
WHERE a.AuditId IS NULL;

--2.Payments with no audit entry
USE RetailQEDb;
-- Approved payments need a 'Payment' audit row
SELECT p.PaymentId, p.OrderId
FROM Payments p
LEFT JOIN AuditLog a ON a.EntityType = 'Payment' AND a.EntityId = p.OrderId AND a.CreatedAt >= p.CreatedAt
WHERE p.Status = 'Approved' AND a.AuditId IS NULL;

-- Refunds need a 'Return' audit row
SELECT p.PaymentId, p.OrderId
FROM Payments p
LEFT JOIN AuditLog a ON a.EntityType = 'Return' AND a.EntityId = p.OrderId AND a.CreatedAt >= p.CreatedAt
WHERE p.Status = 'Refunded' AND a.AuditId IS NULL;

--3. Shipped or Delivered shipments with no audit entry for that status
USE RetailQEDb;
SELECT s.ShipmentId, s.Status
FROM Shipments s
LEFT JOIN AuditLog a ON a.EntityType = 'Shipment' AND a.EntityId = s.ShipmentId AND a.Action = s.Status
WHERE s.Status IN ('Shipped', 'Delivered') AND a.AuditId IS NULL;

--4. Does each audit row have an actor?
USE RetailQEDb;
SELECT TOP 5 * FROM AuditLog;

--T-DB-AUD-002: Return audit trail is complete

--1. See what the audit log calls things
USE RetailQEDb;
SELECT DISTINCT EntityType, Action FROM AuditLog;

--2. Show each return’s audit trail
USE RetailQEDb;
SELECT r.ReturnId, a.EntityType, a.Action, a.CreatedAt
FROM Returns r
JOIN AuditLog a ON a.EntityType = 'Return' AND a.EntityId = r.OrderId
ORDER BY r.ReturnId, a.AuditId;

--3. Returns with no audit entries at all
USE RetailQEDb;
SELECT r.ReturnId, a.AuditId
FROM Returns r
LEFT JOIN AuditLog a ON a.EntityType = 'Return' AND a.EntityId = r.OrderId
WHERE a.AuditId IS NULL;

--T-DB-AUD-003: Shipped and delivered notifications are logged

--1. Shipped or Delivered shipments with no notification entry
USE RetailQEDb;
SELECT s.ShipmentId, s.Status
FROM Shipments s
LEFT JOIN AuditLog a ON a.EntityType = 'Shipment' AND a.EntityId = s.ShipmentId
                    AND a.Details LIKE '%notification%'
WHERE s.Status IN ('Shipped', 'Delivered') AND a.AuditId IS NULL;

--2. Duplicate notifications
USE RetailQEDb;
SELECT EntityId AS ShipmentId, Action, COUNT(*) AS Notifications
FROM AuditLog
WHERE EntityType = 'Shipment' AND Details LIKE '%notification%'
GROUP BY EntityId, Action
HAVING COUNT(*) > 1;

-- 
--1. Paid orders with no payment
USE RetailQEDb;
SELECT OrderId FROM Orders
WHERE Status = 'Paid' AND OrderId NOT IN (SELECT OrderId FROM Payments);

--2. Payments with no order
USE RetailQEDb;
SELECT PaymentId FROM Payments
WHERE OrderId NOT IN (SELECT OrderId FROM Orders);

--3. Orders with items but no stock ledger entry
USE RetailQEDb;
SELECT DISTINCT OrderId FROM OrderItems
WHERE OrderId NOT IN (SELECT OrderId FROM InventoryLedger WHERE OrderId IS NOT NULL);

--4. Shipments with no payment for their order
USE RetailQEDb;
SELECT ShipmentId FROM Shipments
WHERE OrderId NOT IN (SELECT OrderId FROM Payments);
