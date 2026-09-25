const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8081'

export const apiFetch = (endpoint, options = {}) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    localStorage.getItem('accessToken') ||
    ''

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { 'Content-Type': 'application/json' }),

    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),

    ...(options.headers || {}),
  }

  return fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  )
}

export default API_URL