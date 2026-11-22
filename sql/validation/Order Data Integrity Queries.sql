--Look First
USE RetailQEDb;
GO
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders';
SELECT DISTINCT Status FROM Orders;

--T-DB-ORD-001: Every order has a valid customer and at least one line item

--1. Orders with no customer (expect 0 rows)
SELECT OrderId FROM Orders
WHERE CustomerId NOT IN (SELECT CustomerId FROM Customers);

--2. Orders with no line items (expect 0 rows)
SELECT OrderId FROM Orders
WHERE OrderId NOT IN (SELECT OrderId FROM OrderItems);

--3. Line items with no order (expect 0 rows)
SELECT OrderItemId FROM OrderItems
WHERE OrderId NOT IN (SELECT OrderId FROM Orders);

--T-DB-ORD-002: Order total equals line totals + tax - discount

--1. Subtotal matches the sum of the lines (expect 0 rows)
SELECT o.OrderId, o.Subtotal, SUM(i.LineTotal) AS LinesTotal
FROM Orders o
JOIN OrderItems i ON i.OrderId = o.OrderId
GROUP BY o.OrderId, o.Subtotal
HAVING o.Subtotal <> SUM(i.LineTotal);

--2. Total = Subtotal + Tax - Discount (expect 0 rows)
SELECT OrderId, Subtotal, TaxAmount, DiscountAmount, Total
FROM Orders
WHERE ABS(Total - (Subtotal + TaxAmount - DiscountAmount)) > 0.01;

--3. Each line is quantity x price (expect 0 rows)
SELECT OrderItemId, OrderId, Quantity, UnitPrice, LineTotal
FROM OrderItems
WHERE ABS(LineTotal - Quantity * UnitPrice) > 0.01;

--Bonus: SAVE10 should be 10% (expect 0 rows; this is the coupon defect LCP2-154)
USE RetailQEDb;
SELECT OrderId, CouponCode, Subtotal, DiscountAmount FROM Orders WHERE CouponCode = 'SAVE10';

--T-DB-ORD-003: No duplicate orders in a short window

--Same customer, same total, created within 5 seconds of each other (expect 0 rows)
SELECT a.OrderId AS OrderA, b.OrderId AS OrderB, a.CustomerId, a.Total,
       a.CreatedAt AS CreatedA, b.CreatedAt AS CreatedB
FROM Orders a
JOIN Orders b ON b.CustomerId = a.CustomerId
             AND b.Total = a.Total
             AND b.OrderId > a.OrderId
             AND b.CreatedAt >= a.CreatedAt
             AND b.CreatedAt <= DATEADD(SECOND, 5, a.CreatedAt);

--T-DB-ORD-004: Cancelled orders and paid orders

--1. Cancelled orders have a cancel timestamp (expect 0 rows)
SELECT OrderId, Status, CreatedAt, UpdatedAt
FROM Orders
WHERE Status = 'Cancelled' AND UpdatedAt = CreatedAt;

--2. Paid orders not modified after payment (expect 0 rows)
SELECT o.OrderId, o.UpdatedAt, p.CreatedAt AS PaidAt
FROM Orders o
JOIN Payments p ON p.OrderId = o.OrderId AND p.Status = 'Approved'
WHERE o.UpdatedAt > DATEADD(SECOND, 5, p.CreatedAt);

--3. Cancelled orders still holding reserved stock (expect 0 rows)
SELECT l.OrderId, l.ProductId, SUM(l.ChangeQuantity) AS NetChange
FROM InventoryLedger l
JOIN Orders o ON o.OrderId = l.OrderId
WHERE o.Status = 'Cancelled'
GROUP BY l.OrderId, l.ProductId
HAVING SUM(l.ChangeQuantity) <> 0;

