import { api } from '@/lib/api/client'
import type { SearchHit, SearchResponse } from '@/lib/types'

export async function search(query: string): Promise<SearchHit[]> {
  const q = query.trim()
  if (!q) return []
  const response = await api.get<SearchResponse>(`/search?q=${encodeURIComponent(q)}`)
  return response.hits
}
