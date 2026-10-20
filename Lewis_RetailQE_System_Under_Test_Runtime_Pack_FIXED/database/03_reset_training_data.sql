USE RetailQEDb;
GO
DELETE FROM AuditLog;
DELETE FROM InventoryLedger;
DELETE FROM Returns;
DELETE FROM Shipments;
DELETE FROM Payments;
DELETE FROM OrderItems;
DELETE FROM Orders;
DELETE FROM Users;
DELETE FROM Products;
DELETE FROM Customers;
DBCC CHECKIDENT ('Orders', RESEED, 0);
DBCC CHECKIDENT ('OrderItems', RESEED, 0);
DBCC CHECKIDENT ('Payments', RESEED, 0);
DBCC CHECKIDENT ('Shipments', RESEED, 0);
DBCC CHECKIDENT ('Returns', RESEED, 0);
DBCC CHECKIDENT ('InventoryLedger', RESEED, 0);
DBCC CHECKIDENT ('AuditLog', RESEED, 0);
DBCC CHECKIDENT ('Users', RESEED, 0);

-- The :r directive is a sqlcmd command and is not valid in standard SQL execution.
-- Run 02_seed.sql separately in SQLCMD mode if you want to reseed the training data.
GO
