const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
export async function api(path, options={}) {
  const r = await fetch(base+path,{ headers:{'Content-Type':'application/json',...(options.headers||{})}, ...options })
  const data = r.status===204 ? null : await r.json().catch(()=>({}))
  if (!r.ok) throw new Error(data?.message || `Request failed (${r.status})`)
  return data
}
