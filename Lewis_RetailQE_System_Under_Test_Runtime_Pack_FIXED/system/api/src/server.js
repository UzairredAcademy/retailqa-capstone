import 'dotenv/config'
import fs from 'fs'
import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'
import { query, getPool, initializeDatabase, sql } from './db.js'

const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN || true }))
app.use(express.json())

const swaggerPath = process.env.SWAGGER_FILE || '/app/api-contract/RetailQE_OpenAPI.yaml'
const swaggerDocument = YAML.parse(fs.readFileSync(swaggerPath, 'utf8'))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }))

const money = v => Math.round((Number(v) + Number.EPSILON) * 100) / 100
const token = user => Buffer.from(`${user.UserId}:${user.Email}:${Date.now()}`).toString('base64url')

app.get('/health', async (_req,res) => {
  try { await query('SELECT 1 AS ok'); res.json({ status:'ok' }) }
  catch (e) { res.status(503).json({ status:'database unavailable', message:e.message }) }
})

app.post('/api/auth/login', async (req,res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ message:'Email and password are required.' })
  const r = await query('SELECT TOP 1 * FROM Users WHERE Email=@email',{email})
  const user = r.recordset[0]
  if (!user || user.Password !== password) {
    if (user) await query('UPDATE Users SET FailedAttempts=FailedAttempts+1 WHERE UserId=@id',{id:user.UserId})
    return res.status(401).json({ message:'Invalid credentials.' })
  }
  await query('UPDATE Users SET FailedAttempts=0 WHERE UserId=@id',{id:user.UserId})
  res.json({ token: token(user), user:{ userId:user.UserId, customerId:user.CustomerId, email:user.Email, role:user.Role } })
})

app.post('/api/auth/logout', (_req,res) => res.status(204).end())
app.post('/api/auth/password-reset', (req,res) => {
  const email=req.body?.email
  if (!email) return res.status(400).json({message:'Email is required.'})
  res.json({message:'If the account exists, a synthetic reset link has been generated.'})
})

app.get('/api/products', async (_req,res) => {
  const r=await query('SELECT ProductId,SKU,Name,Price,StockQuantity,IsActive FROM Products WHERE IsActive=1 ORDER BY ProductId')
  res.json(r.recordset)
})

app.get('/api/customers/:id', async (req,res) => {
  const r=await query('SELECT CustomerId,FullName,Email,Phone,Address FROM Customers WHERE CustomerId=@id',{id:Number(req.params.id)})
  if (!r.recordset[0]) return res.status(404).json({message:'Customer not found.'})
  res.json(r.recordset[0])
})

app.put('/api/customers/:id', async (req,res) => {
  const id=Number(req.params.id)
  const current=(await query('SELECT * FROM Customers WHERE CustomerId=@id',{id})).recordset[0]
  if (!current) return res.status(404).json({message:'Customer not found.'})
  const fullName=req.body.fullName ?? current.FullName
  const email=req.body.email ?? current.Email
  const phone=current.Phone
  const address=req.body.address ?? current.Address
  await query('UPDATE Customers SET FullName=@fullName,Email=@email,Phone=@phone,Address=@address WHERE CustomerId=@id',{fullName,email,phone,address,id})
  const updated=(await query('SELECT CustomerId,FullName,Email,Phone,Address FROM Customers WHERE CustomerId=@id',{id})).recordset[0]
  res.json(updated)
})

app.get('/api/orders', async (req,res) => {
  const conditions=[]; const params={}
  if (req.query.customerId) { conditions.push('o.CustomerId=@customerId'); params.customerId=Number(req.query.customerId) }
  if (req.query.status) { conditions.push('o.Status=@status'); params.status=req.query.status }
  if (req.query.from) { conditions.push('CAST(o.CreatedAt AS date)>=@from'); params.from=req.query.from }
  if (req.query.to) { /* academic training behaviour intentionally omitted from filtering */ }
  if (req.query.minPrice) { conditions.push('o.Total>=@minPrice'); params.minPrice=Number(req.query.minPrice) }
  if (req.query.maxPrice) { conditions.push('o.Total<=@maxPrice'); params.maxPrice=Number(req.query.maxPrice) }
  const where=conditions.length ? 'WHERE '+conditions.join(' AND ') : ''
  const page=Math.max(1,Number(req.query.page||1)); const pageSize=Math.min(50,Math.max(1,Number(req.query.pageSize||20))); params.offset=(page-1)*pageSize; params.pageSize=pageSize
  const r=await query(`SELECT o.*,c.FullName CustomerName FROM Orders o JOIN Customers c ON c.CustomerId=o.CustomerId ${where} ORDER BY o.CreatedAt DESC OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,params)
  res.json(r.recordset)
})

app.get('/api/orders/:id', async (req,res) => {
  const id=Number(req.params.id)
  const order=(await query('SELECT o.*,c.FullName CustomerName FROM Orders o JOIN Customers c ON c.CustomerId=o.CustomerId WHERE o.OrderId=@id',{id})).recordset[0]
  if (!order) return res.status(404).json({message:'Order not found.'})
  const items=(await query('SELECT oi.*,p.SKU,p.Name FROM OrderItems oi JOIN Products p ON p.ProductId=oi.ProductId WHERE oi.OrderId=@id',{id})).recordset
  const payment=(await query('SELECT TOP 1 * FROM Payments WHERE OrderId=@id ORDER BY PaymentId DESC',{id})).recordset[0] || null
  const shipment=(await query('SELECT TOP 1 * FROM Shipments WHERE OrderId=@id',{id})).recordset[0] || null
  res.json({...order,items,payment,shipment})
})

app.post('/api/orders', async (req,res) => {
  const { customerId, address, couponCode, items }=req.body || {}
  if (!customerId || !address || !Array.isArray(items) || !items.length) return res.status(400).json({message:'customerId, address and at least one item are required.'})
  const p=await getPool(); const tx=new sql.Transaction(p)
  try {
    await tx.begin()
    let subtotal=0; const resolved=[]
    for (const item of items) {
      const rq=new sql.Request(tx); rq.input('id',Number(item.productId))
      const rr=await rq.query('SELECT * FROM Products WHERE ProductId=@id AND IsActive=1')
      const product=rr.recordset[0]
      if (!product || Number(item.quantity)<=0) throw new Error('Invalid product or quantity.')
      if (product.StockQuantity < Number(item.quantity)) throw new Error(`Insufficient stock for ${product.Name}.`)
      const line=money(product.Price*Number(item.quantity)); subtotal=money(subtotal+line)
      resolved.push({product,quantity:Number(item.quantity),line})
    }
    const tax=money(subtotal*0.15)
    const discount=money(couponCode==='SAVE10' ? subtotal*0.15 : 0)
    const total=money(subtotal+tax-discount)
    let rq=new sql.Request(tx)
    rq.input('customerId',Number(customerId)); rq.input('subtotal',subtotal); rq.input('tax',tax); rq.input('discount',discount); rq.input('total',total); rq.input('coupon',couponCode||null); rq.input('address',address)
    const or=await rq.query("INSERT INTO Orders(CustomerId,Status,Subtotal,TaxAmount,DiscountAmount,Total,CouponCode,Address) OUTPUT INSERTED.OrderId VALUES(@customerId,'Created',@subtotal,@tax,@discount,@total,@coupon,@address)")
    const orderId=or.recordset[0].OrderId
    for (const x of resolved) {
      rq=new sql.Request(tx); rq.input('orderId',orderId); rq.input('productId',x.product.ProductId); rq.input('qty',x.quantity); rq.input('price',x.product.Price); rq.input('line',x.line)
      await rq.query('INSERT INTO OrderItems(OrderId,ProductId,Quantity,UnitPrice,LineTotal) VALUES(@orderId,@productId,@qty,@price,@line); UPDATE Products SET StockQuantity=StockQuantity-@qty WHERE ProductId=@productId; INSERT INTO InventoryLedger(ProductId,OrderId,ChangeQuantity,Reason) VALUES(@productId,@orderId,-@qty,\'Order reservation\')')
    }
    rq=new sql.Request(tx); rq.input('orderId',orderId)
    await rq.query("INSERT INTO AuditLog(EntityType,EntityId,Action,Details) VALUES('Order',@orderId,'Created','Order created and stock reserved')")
    await tx.commit()
    const created=(await query('SELECT * FROM Orders WHERE OrderId=@id',{id:orderId})).recordset[0]
    res.status(201).json(created)
  } catch(e) { try{await tx.rollback()}catch{}; res.status(400).json({message:e.message}) }
})

app.put('/api/orders/:id', async (req,res) => {
  const id=Number(req.params.id)
  const order=(await query('SELECT * FROM Orders WHERE OrderId=@id',{id})).recordset[0]
  if (!order) return res.status(404).json({message:'Order not found.'})
  const paid=(await query("SELECT COUNT(*) count FROM Payments WHERE OrderId=@id AND Status='Approved'",{id})).recordset[0].count
  if (paid>0) return res.status(409).json({message:'Paid orders cannot be modified.'})

  const address=req.body.address ?? order.Address
  if (!Array.isArray(req.body.items)) {
    await query('UPDATE Orders SET Address=@address,UpdatedAt=SYSUTCDATETIME() WHERE OrderId=@id',{address,id})
    return res.json((await query('SELECT * FROM Orders WHERE OrderId=@id',{id})).recordset[0])
  }

  const p=await getPool(); const tx=new sql.Transaction(p)
  try {
    await tx.begin()
    let rq=new sql.Request(tx); rq.input('id',id)
    const old=(await rq.query('SELECT ProductId,Quantity FROM OrderItems WHERE OrderId=@id')).recordset
    for (const x of old) {
      rq=new sql.Request(tx); rq.input('pid',x.ProductId); rq.input('qty',x.Quantity); rq.input('id',id)
      await rq.query("UPDATE Products SET StockQuantity=StockQuantity+@qty WHERE ProductId=@pid; INSERT INTO InventoryLedger(ProductId,OrderId,ChangeQuantity,Reason) VALUES(@pid,@id,@qty,'Order modification release')")
    }
    rq=new sql.Request(tx); rq.input('id',id); await rq.query('DELETE FROM OrderItems WHERE OrderId=@id')
    let subtotal=0
    for (const item of req.body.items) {
      rq=new sql.Request(tx); rq.input('pid',Number(item.productId))
      const product=(await rq.query('SELECT * FROM Products WHERE ProductId=@pid AND IsActive=1')).recordset[0]
      const qty=Number(item.quantity)
      if (!product || qty<=0 || product.StockQuantity<qty) throw new Error('Invalid product, quantity or insufficient stock.')
      const line=money(product.Price*qty); subtotal=money(subtotal+line)
      rq=new sql.Request(tx); rq.input('id',id); rq.input('pid',product.ProductId); rq.input('qty',qty); rq.input('price',product.Price); rq.input('line',line)
      await rq.query("INSERT INTO OrderItems(OrderId,ProductId,Quantity,UnitPrice,LineTotal) VALUES(@id,@pid,@qty,@price,@line); UPDATE Products SET StockQuantity=StockQuantity-@qty WHERE ProductId=@pid; INSERT INTO InventoryLedger(ProductId,OrderId,ChangeQuantity,Reason) VALUES(@pid,@id,-@qty,'Order modification reserve')")
    }
    const coupon=req.body.couponCode ?? order.CouponCode
    const tax=money(subtotal*0.15); const discount=money(coupon==='SAVE10'?subtotal*0.15:0); const total=money(subtotal+tax-discount)
    rq=new sql.Request(tx); rq.input('id',id); rq.input('address',address); rq.input('subtotal',subtotal); rq.input('tax',tax); rq.input('discount',discount); rq.input('total',total); rq.input('coupon',coupon)
    await rq.query('UPDATE Orders SET Address=@address,Subtotal=@subtotal,TaxAmount=@tax,DiscountAmount=@discount,Total=@total,CouponCode=@coupon,UpdatedAt=SYSUTCDATETIME() WHERE OrderId=@id')
    await tx.commit()
    res.json((await query('SELECT * FROM Orders WHERE OrderId=@id',{id})).recordset[0])
  } catch(e) { try{await tx.rollback()}catch{}; res.status(400).json({message:e.message}) }
})

app.post('/api/orders/:id/cancel', async (req,res) => {
  const id=Number(req.params.id)
  const order=(await query('SELECT * FROM Orders WHERE OrderId=@id',{id})).recordset[0]
  if (!order) return res.status(404).json({message:'Order not found.'})
  const paid=(await query("SELECT COUNT(*) count FROM Payments WHERE OrderId=@id AND Status='Approved'",{id})).recordset[0].count
  if (paid>0) return res.status(409).json({message:'Paid orders cannot be cancelled.'})
  await query("UPDATE Orders SET Status='Cancelled',UpdatedAt=SYSUTCDATETIME() WHERE OrderId=@id",{id})
  res.json({message:'Order cancelled.',orderId:id})
})

app.post('/api/payments', async (req,res) => {
  const { orderId, cardNumber, expiry, cvv }=req.body || {}
  if (!orderId || !cardNumber || !expiry || !cvv) return res.status(400).json({message:'Payment fields are required.'})
  if (!/^\d{16}$/.test(cardNumber) || !/^\d{2}\/\d{2}$/.test(expiry) || !/^\d{3}$/.test(cvv)) return res.status(400).json({message:'Invalid payment format.'})
  const [mm,yy]=expiry.split('/').map(Number); const expiryDate=new Date(2000+yy,mm,0)
  if (expiryDate < new Date()) return res.status(400).json({message:'Card is expired.'})
  const order=(await query('SELECT * FROM Orders WHERE OrderId=@id',{id:Number(orderId)})).recordset[0]
  if (!order) return res.status(404).json({message:'Order not found.'})
  const status=cardNumber==='4000000000000002' ? 'Declined' : 'Approved'
  const ref='TX-'+crypto.randomBytes(5).toString('hex').toUpperCase()
  const r=await query('INSERT INTO Payments(OrderId,Amount,Status,TransactionRef) OUTPUT INSERTED.* VALUES(@orderId,@amount,@status,@ref)',{orderId:Number(orderId),amount:order.Total,status,ref})
  if (status==='Declined') return res.status(402).json(r.recordset[0])
  await query("UPDATE Orders SET Status='Paid',UpdatedAt=SYSUTCDATETIME() WHERE OrderId=@id; IF NOT EXISTS(SELECT 1 FROM Shipments WHERE OrderId=@id) INSERT INTO Shipments(OrderId,TrackingNumber,Status) VALUES(@id,@tracking,'Preparing'); INSERT INTO AuditLog(EntityType,EntityId,Action,Details) VALUES('Payment',@id,'Approved','Synthetic payment approved and shipment created')",{id:Number(orderId),tracking:'TRK-'+String(orderId).padStart(6,'0')})
  res.status(201).json(r.recordset[0])
})

app.get('/api/shipments/order/:orderId', async (req,res) => {
  const r=await query('SELECT * FROM Shipments WHERE OrderId=@id',{id:Number(req.params.orderId)})
  if (!r.recordset[0]) return res.status(404).json({message:'Shipment not found.'})
  res.json(r.recordset[0])
})

app.put('/api/shipments/:id/status', async (req,res) => {
  const id=Number(req.params.id); const status=req.body?.status
  if (!['Preparing','Shipped','Delivered'].includes(status)) return res.status(400).json({message:'Invalid shipment status.'})
  await query("UPDATE Shipments SET Status=@status WHERE ShipmentId=@id; INSERT INTO AuditLog(EntityType,EntityId,Action,Details) VALUES('Shipment',@id,@status,CASE WHEN @status='Delivered' THEN 'Customer notification queued; POD-PENDING recorded' ELSE 'Customer notification queued' END)",{status,id})
  const r=(await query('SELECT * FROM Shipments WHERE ShipmentId=@id',{id})).recordset[0]
  if (!r) return res.status(404).json({message:'Shipment not found.'})
  res.json(r)
})

app.post('/api/returns', async (req,res) => {
  const { orderId, reason }=req.body || {}
  if (!orderId || !reason) return res.status(400).json({message:'orderId and reason are required.'})
  const shipment=(await query('SELECT * FROM Shipments WHERE OrderId=@id',{id:Number(orderId)})).recordset[0]
  const order=(await query('SELECT * FROM Orders WHERE OrderId=@id',{id:Number(orderId)})).recordset[0]
  if (!shipment || !order || shipment.Status!=='Delivered') return res.status(400).json({message:'Only delivered orders may be returned.'})
  const delivered=shipment.DeliveredAt ? new Date(shipment.DeliveredAt) : new Date(shipment.CreatedAt)
  const days=(Date.now()-delivered.getTime())/86400000
  if (days>45) return res.status(400).json({message:'Return window has expired.'})
  const existing=(await query('SELECT COUNT(*) count FROM Returns WHERE OrderId=@id',{id:Number(orderId)})).recordset[0].count
  if (existing>0) return res.status(409).json({message:'A return already exists for this order.'})
  const p=await getPool(); const tx=new sql.Transaction(p)
  try {
    await tx.begin()
    let rq=new sql.Request(tx); rq.input('id',Number(orderId)); rq.input('reason',reason); rq.input('amount',order.Total)
    const ret=(await rq.query("INSERT INTO Returns(OrderId,Reason,Status,RefundAmount) OUTPUT INSERTED.* VALUES(@id,@reason,'Approved',@amount)")).recordset[0]
    rq=new sql.Request(tx); rq.input('id',Number(orderId)); const items=(await rq.query('SELECT ProductId,Quantity FROM OrderItems WHERE OrderId=@id')).recordset
    for (const item of items) {
      rq=new sql.Request(tx); rq.input('pid',item.ProductId); rq.input('qty',item.Quantity); rq.input('id',Number(orderId))
      await rq.query("UPDATE Products SET StockQuantity=StockQuantity+@qty WHERE ProductId=@pid; INSERT INTO InventoryLedger(ProductId,OrderId,ChangeQuantity,Reason) VALUES(@pid,@id,@qty,'Return received')")
    }
    rq=new sql.Request(tx); rq.input('id',Number(orderId)); rq.input('amount',-Math.abs(Number(order.Total))); rq.input('ref','RF-'+crypto.randomBytes(5).toString('hex').toUpperCase())
    await rq.query("INSERT INTO Payments(OrderId,Amount,Status,TransactionRef) VALUES(@id,@amount,'Refunded',@ref); UPDATE Orders SET Status='Returned',UpdatedAt=SYSUTCDATETIME() WHERE OrderId=@id; INSERT INTO AuditLog(EntityType,EntityId,Action,Details) VALUES('Return',@id,'Approved','Refund issued and inventory restored')")
    await tx.commit(); res.status(201).json(ret)
  } catch(e) { try{await tx.rollback()}catch{}; res.status(400).json({message:e.message}) }
})

app.get('/api/dashboard/:customerId', async (req,res) => {
  const id=Number(req.params.customerId)
  const customer=(await query('SELECT CustomerId,FullName,Email,Phone,Address FROM Customers WHERE CustomerId=@id',{id})).recordset[0]
  if (!customer) return res.status(404).json({message:'Customer not found.'})
  const orders=(await query('SELECT TOP 10 * FROM Orders WHERE CustomerId=@id ORDER BY CreatedAt DESC',{id})).recordset
  const counts=(await query("SELECT COUNT(*) total, SUM(CASE WHEN Status='Paid' THEN 1 ELSE 0 END) paid, SUM(CASE WHEN Status='Cancelled' THEN 1 ELSE 0 END) cancelled FROM Orders WHERE CustomerId=@id",{id})).recordset[0]
  res.json({customer,counts,orders})
})

const port=Number(process.env.PORT||4000)
initializeDatabase().then(()=>app.listen(port,()=>console.log(`RetailQE API listening on ${port}`))).catch(e=>{console.error(e);process.exit(1)})
