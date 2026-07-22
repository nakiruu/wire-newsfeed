import type { Article } from './types'

export function exactDedup(incoming: Article[], knownIds: Set<string>): Article[] {
  return incoming.filter(a => !knownIds.has(a.id))
}

export function buildBigrams(text: string): Set<string> {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean)
  const bigrams = new Set<string>()
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.add(`${words[i]} ${words[i + 1]}`)
  }
  return bigrams
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  let intersection = 0
  for (const item of a) {
    if (b.has(item)) intersection++
  }
  const union = a.size + b.size - intersection
  return intersection / union
}

const THIRTY_MINUTES_MS = 30 * 60 * 1000
const SIMILARITY_THRESHOLD = 0.75

export function fuzzyDedup(articles: Article[]): Article[] {
  const result: Article[] = []
  for (const candidate of articles) {
    const candidateBigrams = buildBigrams(candidate.title)
    const candidateTime = new Date(candidate.published_at).getTime()
    const matched = result.find(existing => {
      const existingTime = new Date(existing.published_at).getTime()
      if (Math.abs(existingTime - candidateTime) > THIRTY_MINUTES_MS) return false
      return jaccardSimilarity(buildBigrams(existing.title), candidateBigrams) >= SIMILARITY_THRESHOLD
    })
    if (matched) {
      matched.also_reported_by = [...(matched.also_reported_by ?? []), candidate.provider_label]
    } else {
      result.push({ ...candidate })
    }
  }
  return result
}
