import sql from 'mssql'
import fs from 'fs/promises'

const baseConfig = {
  server: process.env.SQL_HOST || 'localhost',
  port: Number(process.env.SQL_PORT || 1433),
  user: process.env.SQL_USER || 'sa',
  password: process.env.SQL_PASSWORD || 'RetailQE_Str0ng!2026',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
}

const databaseName = process.env.SQL_DATABASE || 'RetailQEDb'
let pool

function batches(script) {
  return script.split(/^\s*GO\s*$/gim).map(x => x.trim()).filter(Boolean)
}

async function runScript(connection, path) {
  const script = await fs.readFile(path, 'utf8')
  for (const batch of batches(script)) {
    await connection.request().batch(batch)
  }
}

export async function initializeDatabase() {
  let last
  for (let i = 0; i < 45; i++) {
    try {
      const master = await new sql.ConnectionPool({ ...baseConfig, database: 'master' }).connect()
      const dbCheck = await master.request().input('db', databaseName).query('SELECT DB_ID(@db) AS DbId')
      if (!dbCheck.recordset[0].DbId) {
        // The database name is controlled by the facilitator environment, not by user input.
        await master.request().batch(`CREATE DATABASE [${databaseName.replaceAll(']', ']]')}]`)
      }
      await master.close()

      pool = await new sql.ConnectionPool({ ...baseConfig, database: databaseName }).connect()
      const tableCheck = await pool.request().query("SELECT OBJECT_ID('dbo.Customers') AS ObjId")
      const tableExists = !!tableCheck.recordset[0].ObjId

      if (String(process.env.DB_AUTO_INIT || 'true').toLowerCase() === 'true' && !tableExists) {
        await runScript(pool, '/app/database/01_schema.sql')
        await runScript(pool, '/app/database/02_seed.sql')
      }
      return pool
    } catch (e) {
      last = e
      if (pool) { try { await pool.close() } catch {} pool = undefined }
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  throw last
}

export async function getPool() {
  if (!pool) pool = await new sql.ConnectionPool({ ...baseConfig, database: databaseName }).connect()
  return pool
}

export async function query(text, params = {}) {
  const p = await getPool()
  const req = p.request()
  for (const [name, value] of Object.entries(params)) req.input(name, value)
  return req.query(text)
}

export { sql }
