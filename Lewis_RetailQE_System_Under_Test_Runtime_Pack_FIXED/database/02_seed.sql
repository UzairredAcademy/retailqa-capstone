USE RetailQEDb;
GO

SET IDENTITY_INSERT Customers ON;
INSERT INTO Customers(CustomerId,FullName,Email,Phone,Address) VALUES
(1,'Nomsa Daniels','customer1@retailqe.test','0820001001','14 Main Road, Cape Town'),
(2,'Thabo Jacobs','customer2@retailqe.test','0820001002','22 Long Street, Cape Town'),
(3,'Amina Khan','amina@retailqe.test','0820001003','8 Oak Avenue, Cape Town');
SET IDENTITY_INSERT Customers OFF;

INSERT INTO Users(CustomerId,Email,Password,Role) VALUES
(1,'customer1@retailqe.test','Pass123!','Customer'),
(2,'customer2@retailqe.test','Pass123!','Customer'),
(NULL,'admin@retailqe.test','Admin123!','Admin');

SET IDENTITY_INSERT Products ON;
INSERT INTO Products(ProductId,SKU,Name,Price,StockQuantity,IsActive) VALUES
(1,'SKU-1001','Wireless Mouse',450.00,20,1),
(2,'SKU-1002','Office Chair',1400.00,10,1),
(3,'SKU-1003','Desk Lamp',320.00,8,1),
(4,'SKU-1004','USB-C Dock',1250.00,5,1),
(5,'SKU-1005','Laptop Stand',680.00,12,1),
(6,'SKU-1006','Legacy Keyboard',250.00,0,0);
SET IDENTITY_INSERT Products OFF;
GO
