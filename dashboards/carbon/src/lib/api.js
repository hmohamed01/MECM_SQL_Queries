import { useEffect, useState, useSyncExternalStore } from 'react'

const resultPromises = new Map()
const refreshListeners = new Set()
let refreshGeneration = 0

const subscribeToRefresh = (listener) => {
  refreshListeners.add(listener)
  return () => refreshListeners.delete(listener)
}
const getRefreshGeneration = () => refreshGeneration

export const refreshAllQueries = () => {
  refreshGeneration += 1
  resultPromises.clear()
  refreshListeners.forEach((listener) => listener())
}

export class QueryError extends Error {
  constructor(message, details, query) {
    super(message)
    Object.assign(this, { details, query })
  }
}

const requestJson = async (url) => {
  const response = await fetch(url)
  const body = await response.json()
  if (!response.ok) throw new QueryError(body.error?.message ?? response.statusText, body.error, body.query)
  return body
}

const loadQuery = (queryId, params, generation) => {
  const search = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''))
  if (generation > 0) search.set('refresh', '1')
  const url = `/api/queries/${queryId}${search.size ? `?${search}` : ''}`
  const cacheKey = `${generation}:${url}`
  if (!resultPromises.has(cacheKey)) {
    const promise = requestJson(url)
    promise.catch(() => resultPromises.delete(cacheKey))
    resultPromises.set(cacheKey, promise)
  }
  return resultPromises.get(cacheKey)
}

const EMPTY_PARAMS = {}

/** Runs one of the repository's .sql files through the dashboard API. */
export const useQuery = (queryId, params = EMPTY_PARAMS, { enabled = true } = {}) => {
  const generation = useSyncExternalStore(subscribeToRefresh, getRefreshGeneration)
  const paramsKey = JSON.stringify(params)
  const [state, setState] = useState({ status: enabled ? 'loading' : 'idle' })

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle' })
      return undefined
    }
    let isCurrent = true
    setState((previous) => ({ ...previous, status: 'loading', error: undefined }))
    loadQuery(queryId, JSON.parse(paramsKey), generation).then(
      (result) => isCurrent && setState({ status: 'success', result }),
      (error) => isCurrent && setState({ status: 'error', error }),
    )
    return () => {
      isCurrent = false
    }
  }, [queryId, paramsKey, enabled, generation])

  return state
}

export const useStatus = () => {
  const [status, setStatus] = useState(null)
  useEffect(() => {
    requestJson('/api/status').then(setStatus, () => setStatus({ mode: 'offline', connection: 'API unavailable' }))
  }, [])
  return status
}
