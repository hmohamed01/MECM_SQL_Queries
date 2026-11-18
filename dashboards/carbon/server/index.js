import express from 'express'
import compression from 'compression'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILE = path.join(APP_ROOT, '.env')
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE)

const { loadQueryCatalog } = await import('./queryCatalog.js')
const { isLiveMode, connectionLabel, runLiveQuery } = await import('./sqlRunner.js')
const { runSampleQuery } = await import('./sampleData.js')

const isDevMode = process.argv.includes('--dev')
const port = Number(process.env.PORT ?? 4173)
const host = process.env.HOST ?? '127.0.0.1'
const cacheTtlMs = Number(process.env.MECM_CACHE_SECONDS ?? 300) * 1000
const maxRows = Number(process.env.MECM_MAX_ROWS ?? 250000)

const catalog = await loadQueryCatalog()
const resultCache = new Map()

class RequestError extends Error {
  constructor(status, kind, message, notes = []) {
    super(message)
    Object.assign(this, { status, kind, notes })
  }
}

const resolveParams = (query, searchParams) =>
  Object.fromEntries(
    query.params.map((param) => {
      const supplied = searchParams[param.name]
      if (supplied === undefined || supplied === '') return [param.name, param.defaultValue]
      if (param.type === 'INT' || param.type === 'BIGINT') {
        const numericValue = Number(supplied)
        if (!Number.isInteger(numericValue)) throw new RequestError(400, 'parameter', `@${param.name} must be an integer`)
        return [param.name, numericValue]
      }
      const text = String(supplied).slice(0, param.length ?? 4000)
      return [param.name, param.wrapsWithWildcards && !text.includes('%') ? `%${text}%` : text]
    }),
  )

// SQL error 208 = "Invalid object name": the view behind a custom hardware inventory class does not exist yet.
const toRequestError = (error, query) => {
  if (error instanceof RequestError) return error
  if (error.number === 208 || error.originalError?.info?.number === 208) {
    return new RequestError(424, 'prerequisite', error.message, query.notes)
  }
  if (error.code === 'ENODRIVER') return new RequestError(503, 'connection', error.message)
  if (['ELOGIN', 'ESOCKET', 'ETIMEOUT', 'EINSTLOOKUP'].includes(error.code)) {
    const certificateHint = /certificate/i.test(error.message)
      ? " The SQL Server certificate isn't trusted by this machine. Install its issuing CA (preferred), or set MECM_SQL_TRUST_SERVER_CERT=true to skip validation."
      : ''
    return new RequestError(503, 'connection', `Cannot reach ${connectionLabel()}: ${error.message}${certificateHint}`)
  }
  return new RequestError(502, 'query', error.message)
}

const executeQuery = async (query, paramValues) => {
  const startedAt = performance.now()
  const { columns, rows } = isLiveMode() ? await runLiveQuery(query, paramValues) : runSampleQuery(query.id, paramValues)
  return {
    id: query.id,
    source: isLiveMode() ? 'live' : 'sample',
    columns,
    rows: rows.slice(0, maxRows),
    rowCount: rows.length,
    truncated: rows.length > maxRows,
    params: paramValues,
    executedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - startedAt),
  }
}

// Concurrent panels asking for the same query share one in-flight request, and live results are cached briefly.
const getResult = (query, paramValues, bypassCache) => {
  const cacheKey = `${query.id}?${JSON.stringify(paramValues)}`
  const cached = resultCache.get(cacheKey)
  if (cached && !bypassCache && cached.expiresAt > Date.now()) return cached.promise

  const promise = executeQuery(query, paramValues)
  resultCache.set(cacheKey, { promise, expiresAt: Date.now() + (isLiveMode() ? cacheTtlMs : 0) })
  promise.catch(() => resultCache.delete(cacheKey))
  return promise
}

const toMetadata = ({ batch, ...metadata }) => metadata

// A web page can point its own domain at 127.0.0.1 (DNS rebinding) and then read this API as same-origin,
// so requests must name one of this server's own hosts. ALLOWED_HOSTS adds the names a reverse proxy forwards.
const allowedHosts = new Set(
  ['localhost', '127.0.0.1', '[::1]', host, ...(process.env.ALLOWED_HOSTS ?? '').split(',')]
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean),
)

const app = express()

app.use((request, response, next) => {
  const requestHost = request.hostname?.toLowerCase() ?? ''
  if (!allowedHosts.has(requestHost)) {
    response.status(403).type('text').send(`Host "${requestHost}" is not allowed. Add it to ALLOWED_HOSTS in .env.`)
    return
  }
  // Other sites can't read API responses, but their blind requests could still start expensive live queries.
  if (request.path.startsWith('/api/') && request.get('sec-fetch-site') === 'cross-site') {
    response.status(403).json({ error: { kind: 'forbidden', message: 'Cross-site requests are not allowed' } })
    return
  }
  next()
})

app.use(compression())

app.get('/api/status', (_request, response) => {
  response.json({ mode: isLiveMode() ? 'live' : 'sample', connection: connectionLabel(), queryCount: catalog.size })
})

app.get('/api/queries', (_request, response) => {
  response.json([...catalog.values()].map(toMetadata))
})

app.get('/api/queries/:category/:name', async (request, response) => {
  const query = catalog.get(`${request.params.category}/${request.params.name}`)
  if (!query) {
    response.status(404).json({ error: { kind: 'not-found', message: 'Unknown query' } })
    return
  }
  try {
    const paramValues = resolveParams(query, request.query)
    response.json({ ...(await getResult(query, paramValues, request.query.refresh === '1')), query: toMetadata(query) })
  } catch (error) {
    const { status, kind, message, notes } = toRequestError(error, query)
    response.status(status).json({ error: { kind, message, notes }, query: toMetadata(query) })
  }
})

if (isDevMode) {
  const { createServer } = await import('vite')
  const vite = await createServer({ root: APP_ROOT, server: { middlewareMode: true }, appType: 'spa' })
  app.use(vite.middlewares)
} else {
  const distDirectory = path.join(APP_ROOT, 'dist')
  if (!existsSync(distDirectory)) {
    console.error('No production build found. Run "npm run build" first, or "npm run dev" for development.')
    process.exit(1)
  }
  app.use(express.static(distDirectory))
}

app.listen(port, host, () => {
  console.log(`MECM Carbon dashboards → http://${host}:${port}`)
  console.log(`Data source: ${isLiveMode() ? `live SQL (${connectionLabel()})` : 'sample fleet (set MECM_SQL_SERVER in .env for live data)'}`)
  console.log(`Queries loaded: ${catalog.size}`)
})
