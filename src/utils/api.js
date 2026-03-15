const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''

const API_BASE_URL = rawApiBaseUrl
  ? rawApiBaseUrl.replace(/\/+$/, '')
  : import.meta.env.DEV
    ? 'http://localhost:3000'
    : ''

export function apiUrl(path) {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with "/": ${path}`)
  }

  return `${API_BASE_URL}${path}`
}

