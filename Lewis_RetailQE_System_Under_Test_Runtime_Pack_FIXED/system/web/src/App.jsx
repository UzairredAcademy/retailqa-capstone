import React,{useEffect,useState} from 'react'
import {Routes,Route,Link,useNavigate,useParams} from 'react-router-dom'
import {api} from './api'

function getSessionUser(){
 try{
  const u=JSON.parse(localStorage.getItem('retailqeUser')||'null')
  const loginAt=Number(localStorage.getItem('retailqeLoginAt')||0)
  if(u && loginAt && Date.now()-loginAt>30*60*1000){
   localStorage.removeItem('retailqeUser')
   localStorage.removeItem('retailqeToken')
   localStorage.removeItem('retailqeLoginAt')
   return null
  }
  return u
 }catch{
  return null
 }
}

function notifyAuthChanged(){
 window.dispatchEvent(new Event('retailqe-auth-changed'))
}

function Layout({children}){
 const [u,setU]=useState(()=>getSessionUser())

 useEffect(()=>{
  const refresh=()=>setU(getSessionUser())
  window.addEventListener('retailqe-auth-changed',refresh)
  window.addEventListener('storage',refresh)

  // Also re-check periodically so the 30-minute training session expiry
  // is reflected in the navigation without requiring a browser refresh.
  const timer=window.setInterval(refresh,30000)

  return ()=>{
   window.removeEventListener('retailqe-auth-changed',refresh)
   window.removeEventListener('storage',refresh)
   window.clearInterval(timer)
  }
 },[])

 return <>
  <header>
   <div>
    <strong>RetailQE Training Store</strong>
    <small>Lewis capstone SUT</small>
   </div>
   <nav aria-label="Primary navigation">
    {u&&<>
     <Link data-testid="nav-dashboard" to="/dashboard">Dashboard</Link>
     <Link data-testid="nav-orders" to="/orders">Orders</Link>
     {u.role!=='Admin'&&<Link data-testid="nav-create-order" to="/create-order">New Order</Link>}
     {u.customerId&&<Link data-testid="nav-profile" to="/profile">Profile</Link>}
    </>}
    <Link data-testid="nav-auth" to={u?'/logout':'/login'}>{u?'Sign out':'Login'}</Link>
   </nav>
  </header>
  <main>{children}</main>
 </>
}

function Login(){
 const [email,setEmail]=useState('customer1@retailqe.test'),[password,setPassword]=useState('Pass123!'),[error,setError]=useState(''); const nav=useNavigate()
 async function submit(e){e.preventDefault();setError('');try{const r=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});localStorage.setItem('retailqeUser',JSON.stringify(r.user));localStorage.setItem('retailqeToken',r.token);localStorage.setItem('retailqeLoginAt',String(Date.now()));notifyAuthChanged();nav('/dashboard')}catch(e){setError(e.message)}}
 function clear(){localStorage.removeItem('retailqeUser');localStorage.removeItem('retailqeToken');localStorage.removeItem('retailqeLoginAt');notifyAuthChanged();setError('')}
 return <section className="panel narrow"><h1>Login</h1><p className="muted">Use the supplied synthetic test credentials.</p>{error&&<div className="error" data-testid="login-error">{error}</div>}<form onSubmit={submit}><label>Email<input data-testid="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input data-testid="password" type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button data-testid="login-button">Login</button></form><div className="actions"><button className="linkbutton" onClick={clear}>Clear session</button><Link to="/reset-password">Forgot password?</Link></div></section>
}

function Logout(){
 useEffect(()=>{localStorage.removeItem('retailqeUser');localStorage.removeItem('retailqeToken');localStorage.removeItem('retailqeLoginAt');notifyAuthChanged()},[])
 return <section className="panel narrow"><h1>Signed out</h1><p>Your local training session has been cleared.</p><Link to="/login">Return to login</Link></section>
}

function ResetPassword(){
 const [email,setEmail]=useState('customer1@retailqe.test'),[msg,setMsg]=useState(''),[err,setErr]=useState('')
 async function submit(e){e.preventDefault();try{setErr('');const r=await api('/auth/password-reset',{method:'POST',body:JSON.stringify({email})});setMsg(r.message)}catch(e){setErr(e.message)}}
 return <section className="panel narrow"><h1>Password Reset</h1>{err&&<div className="error">{err}</div>}{msg&&<div className="success">{msg}</div>}<form onSubmit={submit}><label>Email<input value={email} onChange={e=>setEmail(e.target.value)}/></label><button>Request reset</button></form></section>
}

function Dashboard(){
 const u=getSessionUser(); const [data,setData]=useState(null),[err,setErr]=useState('')
 useEffect(()=>{if(u?.customerId) api('/dashboard/'+u.customerId).then(setData).catch(e=>setErr(e.message))},[])
 if(!u) return <p>Please login.</p>; if(u.role==='Admin') return <section className="panel"><h1>Admin Dashboard</h1><p>Use API/database resources and Orders page for the training flows.</p></section>
 return <><h1>Customer Dashboard</h1>{err&&<div className="error">{err}</div>}<div className="cards"><Card title="Total Orders" value={data?.counts?.total??0}/><Card title="Paid" value={data?.counts?.paid??0}/><Card title="Cancelled" value={data?.counts?.cancelled??0}/></div><section className="panel"><h2>Quick Actions</h2><div className="actions"><Link className="buttonlink" to="/orders">View My Orders</Link><Link className="buttonlink" to="/create-order">Create New Order</Link><Link className="buttonlink secondary" to="/profile">My Profile</Link></div></section><section className="panel"><h2>Recent Orders</h2>{data?.orders?.length?data.orders.map(o=><OrderRow key={o.OrderId} o={o}/>):<p className="muted">No orders yet. Use Create New Order to begin a test flow.</p>}</section></>
}
function Card({title,value}){return <div className="card"><span>{title}</span><strong>{value}</strong></div>}
function OrderRow({o}){return <div className="orderrow" data-testid={`order-${o.OrderId}`}><div><b>Order #{o.OrderId}</b><small>{new Date(o.CreatedAt).toLocaleString()}</small></div><span>{o.Status}</span><span>R {Number(o.Total).toFixed(2)}</span><Link to={`/orders/${o.OrderId}`}>View</Link></div>}

function Orders(){const u=getSessionUser();const [orders,setOrders]=useState([]),[status,setStatus]=useState(''),[min,setMin]=useState(''),[max,setMax]=useState(''); async function load(){let q=[];if(u?.customerId)q.push('customerId='+u.customerId);if(status)q.push('status='+status);if(min)q.push('minPrice='+min);if(max)q.push('maxPrice='+max);setOrders(await api('/orders?'+q.join('&')))} useEffect(()=>{load()},[]);return <><h1>Orders</h1><section className="panel filters"><select data-testid="status-filter" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option><option>Created</option><option>Paid</option><option>Cancelled</option></select><input placeholder="Min price" value={min} onChange={e=>setMin(e.target.value)}/><input placeholder="Max price" value={max} onChange={e=>setMax(e.target.value)}/><button onClick={load}>Apply filters</button></section><section className="panel">{orders.map(o=><OrderRow key={o.OrderId} o={o}/>)}</section></>}

function CreateOrder(){const u=getSessionUser();const [products,setProducts]=useState([]),[qty,setQty]=useState({}),[coupon,setCoupon]=useState(''),[address,setAddress]=useState('14 Main Road, Cape Town'),[msg,setMsg]=useState(''),[err,setErr]=useState('');useEffect(()=>{api('/products').then(setProducts)},[]);async function submit(){try{setErr('');const items=Object.entries(qty).filter(([,q])=>Number(q)>0).map(([productId,quantity])=>({productId:Number(productId),quantity:Number(quantity)}));const r=await api('/orders',{method:'POST',body:JSON.stringify({customerId:u?.customerId||1,address,couponCode:coupon||null,items})});setMsg(`Order #${r.OrderId} created. Total R ${Number(r.Total).toFixed(2)}`)}catch(e){setErr(e.message)}}return <><h1>Create Order</h1>{err&&<div className="error">{err}</div>}{msg&&<div className="success">{msg}</div>}<section className="panel"><label>Delivery address<input value={address} onChange={e=>setAddress(e.target.value)}/></label><label>Coupon<input data-testid="coupon" value={coupon} onChange={e=>setCoupon(e.target.value)} placeholder="Optional"/></label><div className="productgrid">{products.map(p=><div className="product" key={p.ProductId}><b>{p.Name}</b><span>{p.SKU}</span><span>R {Number(p.Price).toFixed(2)}</span><span>Stock: {p.StockQuantity}</span><input data-testid={`qty-${p.ProductId}`} type="number" min="0" value={qty[p.ProductId]||0} onChange={e=>setQty({...qty,[p.ProductId]:e.target.value})}/></div>)}</div><button data-testid="create-order" onClick={submit}>Create Order</button></section></>}

function OrderDetail(){const {id}=useParams();const [o,setO]=useState(null),[card,setCard]=useState('4242424242424242'),[err,setErr]=useState(''),[msg,setMsg]=useState('');const load=()=>api('/orders/'+id).then(setO).catch(e=>setErr(e.message));useEffect(load,[id]);async function pay(){try{const r=await api('/payments',{method:'POST',body:JSON.stringify({orderId:Number(id),cardNumber:card,expiry:'12/30',cvv:'123'})});setMsg(`Payment ${r.Status}: ${r.TransactionRef}`);load()}catch(e){setErr(e.message)}}async function cancel(){try{await api(`/orders/${id}/cancel`,{method:'POST'});setMsg('Order cancelled');load()}catch(e){setErr(e.message)}}async function ship(status){try{if(!o?.shipment)return;await api(`/shipments/${o.shipment.ShipmentId}/status`,{method:'PUT',body:JSON.stringify({status})});setMsg('Shipment updated');load()}catch(e){setErr(e.message)}}return <><h1>Order #{id}</h1>{err&&<div className="error">{err}</div>}{msg&&<div className="success">{msg}</div>}{o&&<section className="panel"><p>Status: <b>{o.Status}</b></p><p>Subtotal R {Number(o.Subtotal).toFixed(2)} | Tax R {Number(o.TaxAmount).toFixed(2)} | Discount R {Number(o.DiscountAmount).toFixed(2)} | <b>Total R {Number(o.Total).toFixed(2)}</b></p><h3>Items</h3>{o.items.map(i=><p key={i.OrderItemId}>{i.Name} × {i.Quantity} = R {Number(i.LineTotal).toFixed(2)}</p>)}{(!o.payment || o.payment.Status!=='Approved')&&<div className="actions"><input data-testid="card-number" value={card} onChange={e=>setCard(e.target.value)}/><button data-testid="pay-button" onClick={pay}>Pay</button><button className="danger" onClick={cancel}>Cancel</button></div>}{o.payment&&<p>Payment: {o.payment.Status} / {o.payment.TransactionRef}</p>}{o.shipment&&<div><p>Tracking: {o.shipment.TrackingNumber} / {o.shipment.Status}</p><button onClick={()=>ship('Shipped')}>Mark Shipped</button> <button onClick={()=>ship('Delivered')}>Mark Delivered</button>{o.shipment.Status==='Delivered'&&<button onClick={async()=>{try{const r=await api('/returns',{method:'POST',body:JSON.stringify({orderId:Number(id),reason:'Customer return request'})});setMsg(`Return #${r.ReturnId} created`);load()}catch(e){setErr(e.message)}}}>Request Return</button>}</div>}</section>}</>}

function Profile(){const u=getSessionUser();const [p,setP]=useState(null),[msg,setMsg]=useState('');useEffect(()=>{if(u?.customerId)api('/customers/'+u.customerId).then(setP)},[]);if(!p)return <p>Customer profile unavailable for this user.</p>;async function save(){const r=await api('/customers/'+p.CustomerId,{method:'PUT',body:JSON.stringify({fullName:p.FullName,email:p.Email,phone:p.Phone,address:p.Address})});setP(r);setMsg('Profile saved.')}return <><h1>Profile</h1>{msg&&<div className="success">{msg}</div>}<section className="panel"><label>Name<input value={p.FullName} onChange={e=>setP({...p,FullName:e.target.value})}/></label><label>Email<input value={p.Email} onChange={e=>setP({...p,Email:e.target.value})}/></label><label>Phone<input data-testid="profile-phone" value={p.Phone} onChange={e=>setP({...p,Phone:e.target.value})}/></label><label>Address<input value={p.Address} onChange={e=>setP({...p,Address:e.target.value})}/></label><button onClick={save}>Save</button></section></>}

export default function App(){return <Layout><Routes><Route path="/" element={<Login/>}/><Route path="/login" element={<Login/>}/><Route path="/logout" element={<Logout/>}/><Route path="/reset-password" element={<ResetPassword/>}/><Route path="/dashboard" element={<Dashboard/>}/><Route path="/orders" element={<Orders/>}/><Route path="/orders/:id" element={<OrderDetail/>}/><Route path="/create-order" element={<CreateOrder/>}/><Route path="/profile" element={<Profile/>}/></Routes></Layout>}
