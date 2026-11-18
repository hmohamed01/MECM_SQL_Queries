const env = process.env

export const isLiveMode = () => Boolean(env.MECM_SQL_SERVER)

export const connectionLabel = () =>
  isLiveMode() ? `${env.MECM_SQL_SERVER} / ${env.MECM_SQL_DATABASE ?? 'CM_PS1'}` : 'Sample fleet'

const readBoolean = (value, fallback) => (value === undefined ? fallback : value.toLowerCase() === 'true')

const loadNativeDriver = async () => {
  try {
    return (await import('mssql/msnodesqlv8.js')).default
  } catch {
    throw Object.assign(
      new Error('Windows authentication needs the msnodesqlv8 driver, which installs only on Windows. Use MECM_SQL_AUTH=sql or ntlm elsewhere.'),
      { code: 'ENODRIVER' },
    )
  }
}

// Windows Integrated auth needs the native msnodesqlv8 driver; SQL and NTLM auth use the pure-JS tedious driver.
const createPool = async () => {
  const authMode = (env.MECM_SQL_AUTH ?? 'windows').toLowerCase()
  const server = env.MECM_SQL_SERVER
  const database = env.MECM_SQL_DATABASE ?? 'CM_PS1'
  const encrypt = readBoolean(env.MECM_SQL_ENCRYPT, true)
  const trustServerCertificate = readBoolean(env.MECM_SQL_TRUST_SERVER_CERT, false)
  const requestTimeout = Number(env.MECM_SQL_TIMEOUT_SECONDS ?? 120) * 1000

  if (authMode === 'windows') {
    const sql = await loadNativeDriver()
    const odbcDriver = env.MECM_SQL_ODBC_DRIVER ?? 'ODBC Driver 18 for SQL Server'
    const pool = new sql.ConnectionPool({
      connectionString:
        `Driver={${odbcDriver}};Server=${server};Database=${database};Trusted_Connection=yes;` +
        `Encrypt=${encrypt ? 'yes' : 'no'};TrustServerCertificate=${trustServerCertificate ? 'yes' : 'no'};`,
      requestTimeout,
    })
    return { sql, pool: await pool.connect() }
  }

  const { default: sql } = await import('mssql')
  // Accepts the same server forms as SSMS: HOST, HOST\INSTANCE and HOST,PORT.
  const [hostAndInstance, port] = server.split(',')
  const [host, instanceName] = hostAndInstance.split('\\')
  const pool = new sql.ConnectionPool({
    server: host,
    port: port ? Number(port) : undefined,
    database,
    user: env.MECM_SQL_USER,
    password: env.MECM_SQL_PASSWORD,
    domain: authMode === 'ntlm' ? env.MECM_SQL_DOMAIN : undefined,
    requestTimeout,
    options: { encrypt, trustServerCertificate, instanceName },
  })
  return { sql, pool: await pool.connect() }
}

let connectionPromise
const getConnection = () => {
  connectionPromise ??= createPool().catch((error) => {
    connectionPromise = undefined
    throw error
  })
  return connectionPromise
}

const toSqlType = (sql, { type, length }) => {
  const sqlType = { NVARCHAR: sql.NVarChar, VARCHAR: sql.VarChar, INT: sql.Int, BIGINT: sql.BigInt }[type]
  if (!sqlType) throw new Error(`Unsupported parameter type ${type}`)
  return length ? sqlType(length) : sqlType
}

export const runLiveQuery = async (query, paramValues) => {
  const { sql, pool } = await getConnection()
  const request = pool.request()
  for (const param of query.params) {
    request.input(param.name, toSqlType(sql, param), paramValues[param.name])
  }

  const { recordset } = await request.query(query.batch)
  const columns = Object.values(recordset.columns)
    .sort((left, right) => left.index - right.index)
    .map((column) => column.name)
  return { columns, rows: [...recordset] }
}
