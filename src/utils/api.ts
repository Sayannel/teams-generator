const API_BASE_URL = 'https://rscm-volleyball.fr/wp-json'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export async function apiRequest<T = any>(
  endpoint: string,
  method: RequestMethod = 'GET',
  data?: any
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const options: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data)
  }

  const response = await fetch(url, options)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`API error: ${response.status} - ${message}`)
  }

  return response.json()
}
