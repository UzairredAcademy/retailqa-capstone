USE RetailQEDb;
GO

--Look first
SELECT DISTINCT Reason FROM InventoryLedger;
SELECT TOP 10 * FROM InventoryLedger ORDER BY LedgerId DESC;
SELECT DISTINCT Status FROM Returns;

--T-DB-INV-001: Stock on hand is never negative

SELECT ProductId, SKU, StockQuantity
FROM Products
WHERE StockQuantity < 0;

--T-DB-INV-002: Stock movements reconcile

--1. Look at each product
SELECT p.ProductId, p.SKU, p.StockQuantity AS CurrentStock,
       ISNULL(SUM(l.ChangeQuantity), 0) AS LedgerTotal
FROM Products p
LEFT JOIN InventoryLedger l ON l.ProductId = p.ProductId
GROUP BY p.ProductId, p.SKU, p.StockQuantity
ORDER BY p.ProductId;

--2. Let SQL do the sum (expect 0 rows)
SELECT p.SKU, o.Opening, ISNULL(l.LedgerTotal, 0) AS LedgerTotal, p.StockQuantity AS CurrentStock
FROM Products p
JOIN (VALUES (1,20),(2,10),(3,8),(4,5),(5,12),(6,0)) AS o(ProductId, Opening)
     ON o.ProductId = p.ProductId
LEFT JOIN (SELECT ProductId, SUM(ChangeQuantity) AS LedgerTotal
           FROM InventoryLedger GROUP BY ProductId) l ON l.ProductId = p.ProductId
WHERE o.Opening + ISNULL(l.LedgerTotal, 0) <> p.StockQuantity;

--T-DB-INV-003: Cancelling an order releases its stock

--1. See the ledger for cancelled orders
SELECT o.OrderId, l.ProductId, l.ChangeQuantity, l.Reason
FROM Orders o
JOIN InventoryLedger l ON l.OrderId = o.OrderId
WHERE o.Status = 'Cancelled'
ORDER BY o.OrderId, l.LedgerId;

--2. Net effect should be zero
SELECT l.OrderId, l.ProductId, SUM(l.ChangeQuantity) AS NetChange
FROM InventoryLedger l
JOIN Orders o ON o.OrderId = l.OrderId
WHERE o.Status = 'Cancelled'
GROUP BY l.OrderId, l.ProductId
HAVING SUM(l.ChangeQuantity) <> 0;

--T-DB-INV-004: Return receipt restores stock

--Returned orders with no positive ledger entry (expect 0 rows)
SELECT r.ReturnId, r.OrderId, r.Status
FROM Returns r
LEFT JOIN InventoryLedger l ON l.OrderId = r.OrderId AND l.ChangeQuantity > 0
WHERE r.Status IN ('Received', 'Refunded')
  AND l.LedgerId IS NULL;
USE RetailQEDb;
SELECT r.ReturnId, r.OrderId, r.Status
FROM Returns r
LEFT JOIN InventoryLedger l ON l.OrderId = r.OrderId AND l.ChangeQuantity > 0
WHERE r.Status = 'Approved' AND l.LedgerId IS NULL;
USE RetailQEDb;
SELECT ReturnId, OrderId, Status FROM Returns;