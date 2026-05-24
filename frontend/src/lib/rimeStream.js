const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export async function streamAgentAsk({ question, dossierContext, signal, onEvent }) {
  const response = await fetch(`${API_BASE_URL}/agent/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      dossier_context: dossierContext ?? null,
    }),
    signal,
  })

  if (!response.ok || !response.body) {
    let detail = ''
    try {
      const errorBody = await response.json()
      detail = formatApiError(errorBody)
    } catch {
      detail = ''
    }

    throw new Error(detail || `RIME stream unavailable (${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? ''

    for (const chunk of chunks) {
      const event = parseSseChunk(chunk)
      if (event) onEvent(event)
    }
  }

  const tail = parseSseChunk(buffer)
  if (tail) onEvent(tail)
}

function formatApiError(errorBody) {
  if (!errorBody?.detail) return ''
  if (typeof errorBody.detail === 'string') return errorBody.detail

  if (Array.isArray(errorBody.detail)) {
    return errorBody.detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(' ')
  }

  return ''
}

function parseSseChunk(chunk) {
  const data = chunk
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('\n')

  if (!data) return null

  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}
